import * as RemNoteUtil from 'util';

describe('settings', () => {
  it('X', () => {
    expect(RemNoteUtil.getPluginSettings('?test=1')).toEqual({ test: '1' });
    expect(RemNoteUtil.getPluginSettings('?test=1', { test: 2 })).toEqual({ test: '1' });
    expect(RemNoteUtil.getPluginSettings('?', { test: 2 })).toEqual({ test: 2 });
  });
});
