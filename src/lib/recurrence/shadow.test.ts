import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isShadowGeneratedRow } from './shadow';

test('isShadowGeneratedRow — shadows are detected and filtered', () => {
  const shadowRow = {
    id: 'mat_1',
    recurrenceTemplateId: 'tpl_abc',
    generatedFromTemplateId: 'tpl_abc',
    detachReason: 'none',
    recurrenceRule: null,
  };
  assert.equal(isShadowGeneratedRow(shadowRow), true);
});

test('isShadowGeneratedRow — backlinked masters (still carry rrule) are NOT filtered', () => {
  const backlinkedMaster = {
    id: 'master_1',
    recurrenceTemplateId: 'tpl_abc',
    generatedFromTemplateId: 'tpl_abc',
    detachReason: 'none',
    recurrenceRule: 'FREQ=WEEKLY;...',
  };
  assert.equal(isShadowGeneratedRow(backlinkedMaster), false);
});

test('isShadowGeneratedRow — detached rows are never treated as shadow', () => {
  const detached = {
    id: 'det_1',
    recurrenceTemplateId: 'tpl_abc',
    generatedFromTemplateId: 'tpl_abc',
    detachReason: 'edited',
    recurrenceRule: null,
  };
  assert.equal(isShadowGeneratedRow(detached), false);
});

test('isShadowGeneratedRow — ordinary non-recurring rows pass through', () => {
  const ordinary = {
    id: 'ord_1',
    recurrenceTemplateId: null,
    generatedFromTemplateId: null,
    detachReason: 'none',
    recurrenceRule: null,
  };
  assert.equal(isShadowGeneratedRow(ordinary), false);
});
