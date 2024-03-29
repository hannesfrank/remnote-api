import RemNoteAPI from './index';

export async function getContext() {
  const context = await RemNoteAPI.v0.get_context();
  // TODO: transparent preloading
  context.rem = await getRem({ id: context.remId });
  context.document = await getRem({ id: context.documentId });
  return context;
}

export async function getDocument() {
  const context = await RemNoteAPI.v0.get_context();
  const documentRem = await RemNoteAPI.v0.get(context.documentId);
  return documentRem;
}

export async function getRem(options = {}) {
  if (options.id) {
    return RemNoteAPI.v0.get(options.id);
  } else if (options.name) {
    return RemNoteAPI.v0.get_by_name(options.name);
  }
}

export async function getChildren(rem, visibleOnly = false) {
  const children = visibleOnly ? rem.visibleRemOnDocument : rem.children;
  // TODO: Children have the correct order, visibleRemOnDocument don't
  return Promise.all(children.map((remId) => RemNoteAPI.v0.get(remId)));
}

/**
 * Insert an image to a rem.
 * @param {*} rem Rem or RemID
 */
export async function insertImage(rem, imageURL) {
  if (typeof rem === 'string') {
    rem = await getRem({ id: rem });
  }
  // append
  console.log('remnote append', rem);
  if (rem.content) {
    await RemNoteAPI.v0.update(rem._id, {
      content: rem.contentAsMarkdown + `![](${imageURL})`,
    });
  } else {
    await RemNoteAPI.v0.update(rem._id, { name: rem.nameAsMarkdown + `![](${imageURL})` });
  }
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

export function getPluginSettings(urlParamsStr, defaultSettings = {}) {
  const params = new URLSearchParams(urlParamsStr);
  function camelCase(str) {
    return str.replace(/-([a-z])/g, function (g) {
      return g[1].toUpperCase();
    });
  }
  const settings = Object.fromEntries([...params.entries()].map(([k, v]) => [camelCase(k), v]));
  return Object.assign(defaultSettings, settings);
}
