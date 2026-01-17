/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Srikanth Patil
 * @description Duplicate PO/Check # validation for Sales Orders
 */

define(['N/search', 'N/log', 'N/ui/message', 'N/error'],
    function(search, log, message, error) {

        var SOURCE_FIELD = 'otherrefnum';
        var SEARCH_FIELD = 'poastext';
        var HAS_DUP_FIELD = 'custbody_has_dup_po';
        var DUP_NUM_FIELD = 'custbody_dup_so_number';
        var EXCLUDE_FIELD = 'custentity_exclude_dup_check';
        var SAME_CUSTOMER = true;
        var BLOCK_SAVE = false;

        function isCustomerExcluded(custId) {
            if (!custId) return false;
            try {
                var fields = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: custId,
                    columns: [EXCLUDE_FIELD]
                });
                //log.debug('isCustomerExcluded', 'Customer: ' + custId + ' | Excluded: ' + fields[EXCLUDE_FIELD]);
                return fields[EXCLUDE_FIELD] === true;
            } catch (e) {
                //log.error('isCustomerExcluded', e.message);
                return false;
            }
        }

        function findDuplicate(recType, poNum, custId, recId) {
            var filters = [[SEARCH_FIELD, 'is', poNum], 'AND', ['mainline', 'is', 'T']];
            if (SAME_CUSTOMER && custId) {
                filters.push('AND', ['entity', 'anyof', custId]);
            }
            if (recId) {
                filters.push('AND', ['internalid', 'noneof', recId]);
            }
            //log.debug('findDuplicate', 'Filters: ' + JSON.stringify(filters));

            var results = search.create({
                type: recType,
                filters: filters,
                columns: ['tranid']
            }).run().getRange(0, 1);

            //log.debug('findDuplicate', 'Results: ' + results.length);
            return results.length > 0 ? results[0].getValue('tranid') : null;
        }

        function beforeLoad(context) {
            if (context.type !== context.UserEventType.VIEW && context.type !== context.UserEventType.EDIT) return;

            var rec = context.newRecord;
            //log.debug('beforeLoad', 'Record ID: ' + rec.id);

            if (isCustomerExcluded(rec.getValue('entity'))) return;
            if (!rec.getValue(HAS_DUP_FIELD)) return;

            context.form.addPageInitMessage({
                message: message.create({
                    title: 'Duplicate PO Detected',
                    message: 'PO/Check #: <b>' + rec.getValue(SOURCE_FIELD) + '</b> already used on: <b>' + rec.getValue(DUP_NUM_FIELD) + '</b>',
                    type: message.Type.WARNING
                })
            });
            //log.debug('beforeLoad', 'Warning banner displayed');
        }

        function beforeSubmit(context) {
            if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) return;

            var rec = context.newRecord;
            var poNum = rec.getValue(SOURCE_FIELD);
            var custId = rec.getValue('entity');
            //log.debug('beforeSubmit', 'PO#: ' + poNum + ' | Customer: ' + custId);

            if (!poNum || isCustomerExcluded(custId)) {
                rec.setValue({ fieldId: HAS_DUP_FIELD, value: false });
                rec.setValue({ fieldId: DUP_NUM_FIELD, value: '' });
                //log.debug('beforeSubmit', 'Cleared - No PO or customer excluded');
                return;
            }

            var dupSO = findDuplicate(rec.type, poNum, custId, rec.id);

            if (dupSO) {
                rec.setValue({ fieldId: HAS_DUP_FIELD, value: true });
                rec.setValue({ fieldId: DUP_NUM_FIELD, value: dupSO });
                //log.debug('beforeSubmit', 'Duplicate found: ' + dupSO);
                if (BLOCK_SAVE) {
                    throw error.create({
                        name: 'DUPLICATE_PO',
                        message: 'PO/Check # already used on: ' + dupSO
                    });
                }
            } else {
                rec.setValue({ fieldId: HAS_DUP_FIELD, value: false });
                rec.setValue({ fieldId: DUP_NUM_FIELD, value: '' });
                //log.debug('beforeSubmit', 'No duplicate found');
            }
        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
        };
    });
