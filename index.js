/**
 * The RemNote Frontend API allows you to build RemNote plugins.
 * Read more here for a guide, API interface, and examples:
 * https://www.remnote.io/api
 *
 * Version 0.01
 */

/**
 * General interface:
 * RemNoteAPI.v0.makeAPICall(methodName, options);
 *
 * Helper methods (see full signatures on https://www.remnote.io/api):
 * RemNoteAPI.v0.get(remId, options);
 * RemNoteAPI.v0.get_by_name(name, options);
 * RemNoteAPI.v0.get_by_source(url, options);
 * RemNoteAPI.v0.update(remId, options);
 * RemNoteAPI.v0.delete(remId, options);
 * RemNoteAPI.v0.create(text, parentId, options);
 * RemNoteAPI.v0.get_context(options);
 */

/**
 * @typedef {Object} PluginContext
 * @property {string} documentId - The id of the Rem which is displayed as the title.
 * @property {string} remId - The Id of the Rem where the plugin was invoked.
 * @property {string} selectedTextAtActivation - The text which was selected when the plugin was invoked by a shortcut.
 */

/**
 * @typedef
 * @property {Boolean} found - Was a matching Rem found?
 * @property {RemId} _id - The Rem's ID.
 * @property {RemId| Null} parent - The Rem's parent.
 * @property {Array<RemId>} children - The Rem's children.
 * @property {RichText} name - The Rem's name.
 * @property {String} nameAsMarkdown - The Rem's name as markdown.
 * @property {RichText| Undefined} content - The Rem's content.
 * @property {String| Undefined} contentAsMarkdown - The Rem's content as markdown.
 * @property {RichText} source - The Rem's source.
 * @property {Enum(string)} remType - The Rem's type.
 * @property {Boolean} isDocument - Is this Rem marked as a document?
 * @property {Array<RemId>} visibleRemOnDocument - The descendant Rem that appear when this Rem is opened as a Document. (The order is arbitrary.)
 * @property {Date} updatedAt - The date at which this Rem was last updated
 * @property {Date} createdAt - The date at which this Rem was created
 * @property {Array<RemId>} tags - The Rem's tags.(The order is arbitrary.)
 * @property {Array<RemId>} tagChildren - The Rem that are tagged with this Rem. (The order is arbitrary.).
 */

class RemNoteAPIV0 {
  constructor() {
    this.usedMessageIds = 0;
    window.addEventListener('message', this.receiveMessage.bind(this), false);
    this.messagePromises = {};
  }

  /**
   * Get a rem by id.
   * @param {String} remId
   * @param {*} options
   */
  async get(remId, options = {}) {
    return await this.makeAPICall('get', {
      remId,
      ...options,
    });
  }

  async get_by_name(name, options = {}) {
    return await this.makeAPICall('get_by_name', {
      name,
      ...options,
    });
  }

  async get_by_source(url, options = {}) {
    return await this.makeAPICall('get_by_source', {
      url,
      ...options,
    });
  }

  async update(remId, options = {}) {
    return await this.makeAPICall('update', {
      remId,
      ...options,
    });
  }

  async delete(remId, options = {}) {
    return await this.makeAPICall('delete', {
      remId,
      ...options,
    });
  }

  async create(text, parentId, options = {}) {
    return await this.makeAPICall('create', {
      text,
      parentId,
      ...options,
    });
  }

  /**
   * Get the context information about the invokation location of the plugin.
   *
   * @param options
   * @returns {PluginContext} Information about the plugin invokation context.
   */
  async get_context(options = {}) {
    return await this.makeAPICall('get_context', options);
  }

  async close_popup(options = {}) {
    return await this.makeAPICall('close_popup', options);
  }

  async makeAPICall(methodName, options) {
    const messageId = this.usedMessageIds;
    this.usedMessageIds += 1;

    const message = {
      isIntendedForRemNoteAPI: true,
      methodName,
      options,
      messageId,
      remNoteAPIData: {
        version: 0,
      },
    };

    const messagePromise = new Promise((resolve, reject) => {
      this.messagePromises[messageId] = resolve;
      window.parent.postMessage(message, '*');
    });

    const response = await messagePromise;
    if (response.error) {
      throw response.error;
    } else {
      return response;
    }
  }

  receiveMessage(event) {
    const data = event.data;
    const messageId = data.messageId;
    this.messagePromises[messageId](data.response);
    delete this.messagePromises[messageId];
  }
}

const RemNoteAPI = {
  v0: new RemNoteAPIV0(),
};

export default RemNoteAPI;

const SETTINGS_REM = 'Plugin Settings';

export async function getDocument() {
  const context = await RemNoteAPI.v0.get_context();
  console.log('context', context);
  const documentRem = await RemNoteAPI.v0.get(context.documentId);
  return documentRem;
}

export async function getRem(options = {}) {
  if (options.id) {
    return await RemNoteAPI.v0.get(options.id);
  } else if (options.name) {
    return await RemNoteAPI.v0.get_by_name(options.name);
  }
}

export async function getChildren(rem, visibleOnly = False) {
  const children = visibleOnly ? rem.visibleRemOnDocument : rem.children;
  // TODO: Children have the correct order, visibleRemOnDocument don't
  console.log('Children', children);
  children.reverse();
  return await Promise.all(children.map((remId) => RemNoteAPI.v0.get(remId)));
}

export async function getVisibleChildren(remId) {
  return getChildren(remId, true);
}

/**
 * Take a Rem, and extract its text. The rem.name and rem.content fields are
 * both of type "RichTextInterface", which is an array of text strings, or js
 * objects representing rich text element. Text is extracted recursively from
 * Rem Reference elements.
 */
export async function getRemText(rem, exploredRem = []) {
  if (!rem.found) return '';

  const richTextElementsText = await Promise.all(
    // Go through each element in the rich text
    rem.name.concat(rem.content || []).map(async (richTextElement) => {
      // If the element is a string, juts return it
      if (typeof richTextElement == 'string') {
        return richTextElement;
        // If the element is a Rem Reference (i == "q"), then recursively get that Rem Reference's text.
      } else if (richTextElement.i == 'q' && !exploredRem.includes(richTextElement._id)) {
        return await getRemText(
          await RemNoteAPI.v0.get(richTextElement._id),
          // Track explored Rem to avoid infinite loops
          exploredRem.concat([richTextElement._id])
        );
      } else {
        // If the Rem is some other rich text element, just take its .text property.
        return richTextElement.text;
      }
    })
  );
  return richTextElementsText.join('');
}

export async function loadText(remList) {
  await Promise.all(
    remList.map(async (rem) => {
      rem.text = await getRemText(rem);
      return rem;
    })
  );
}

export async function loadTags(rem) {
  rem.tags = await Promise.all(
    rem.tagParents.map(async (tagId) => {
      let tagRem = await RemNoteAPI.v0.get(tagId);
      return tagRem.nameAsMarkdown;
      // let text = await getRemText(tagRem);
      // console.log(text);
      // return text;
    })
  );
}

/** ----------- Plugin related --------------- */

/**
 * @returns URL parameters as an Object. When supplied with duplicate keys, only
 *          the last value is taken
 */
export function getURLConfig() {
  return Object.fromEntries(new URLSearchParams(location.search));
}
