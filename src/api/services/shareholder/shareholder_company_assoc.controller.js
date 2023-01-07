const ShareHolderCompanyAssocModel = require('./shareholder_company_association.model');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const getDRFRequestsByCompany = async (req, res) => {
    const { companyId, request_status } = req.body;

    try {
        let condition = { companyId: ObjectId(companyId) };
        if (request_status) {
            condition.request_status = request_status;
        }
        //const result = await ShareHolderCompanyAssocModel.find(condition, {});
        ShareHolderCompanyAssocModel.aggregate([
            { $match: condition },
            {
                $lookup: {
                    from: 'shareholders', // collection name in db
                    localField: 'shareholderId',
                    foreignField: '_id',
                    pipeline: [{ $project: { otp: 0 } }],
                    as: 'shareholderInfo'
                }
            }
        ]).exec(function (err, data) {
            console.log('error', err);
            if (err) {
                return res.status(500).json({ success: false, data: null, message: err?.message || err });
            }
            return res.status(200).json({ success: true, data, message: 'DRF request list' });
        });
    } catch (err) {
        console.error('Error in fetching DRF request: ', err);
        res.status(500).json({ success: false, data: null, message: err.message });
    }
};

const approveRejectDRFRequest = async (req, res) => {
    const { requestId, request_status, remark } = req.body;

    let error = '';
    if (!requestId) {
        error = 'requestId field is required';
    }
    if (!request_status) {
        error = 'request_status field is required';
    }

    if (request_status === 'REJECTED' && remark === '') {
        error = 'remark field is required for rejected status';
    }

    if (error) {
        return res.status(500).json({ success: false, data: null, message: error });
    }

    try {
        const set = { request_status };
        if (request_status === 'REJECTED') {
            set.remark = remark;
        }
        const isRequestFound = await ShareHolderCompanyAssocModel.count({ _id: Object(requestId) });
        if (!isRequestFound) {
            return res.status(500).json({ success: false, data: null, message: 'Request id not found' });
        }

        await ShareHolderCompanyAssocModel.findByIdAndUpdate({ _id: ObjectId(requestId) }, set, {
            new: true,
            useFindAndModify: true
        });

        return res.status(200).json({ success: true, data: null, message: 'updated successfully' });
    } catch (err) {
        console.error('Error in fetching DRF request: ', err);
        res.status(500).json({ success: false, data: null, message: err.message });
    }
};

module.exports = { getDRFRequestsByCompany, approveRejectDRFRequest };
