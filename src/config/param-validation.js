const Joi = require('joi');

module.exports = {
    // POST /api/auth/login
    adminLogin: {
        body: Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required()
        })
    },

    // POST /api/users/createAdmin
    createAdmin: {
        body: Joi.object({
            email: Joi.string().email().required(),
            username: Joi.string().required(),
            password: Joi.string().min(8).required()
        })
    },

    createStudent: {
        body: Joi.object({
            email: Joi.string().email().required(),
            firstname: Joi.string().required(),
            lastname: Joi.string().required(),
            studentId: Joi.string().required(),
            gender: Joi.string().required(),
            year: Joi.string().min(3).required(),
            password: Joi.string().min(8).required(),
            faculty: Joi.string().min(3).required()
        })
    },

    // POST /api/auth/login
    userLogin: {
        body: Joi.object({
            username: Joi.string().required(),
            email: Joi.string().email(),
            password: Joi.string().required()
        })
    },

    studentLogin: {
        body: Joi.object({
            email: Joi.string().email(),
            password: Joi.string().required()
        })
    },
    // POST /api/users
    createUser: {
        body: Joi.object({
            name: Joi.string().min(3).max(25).required(),
            email: Joi.string().email().required(),
            username: Joi.string().min(3).max(15).required(),
            password: Joi.string().min(8).max(16).required(),
            societyName: Joi.string().min(3).max(30),
            userType: Joi.string().min(3).max(30)
        })
    },

    upsertProduct: {
        body: Joi.object({
            name: Joi.string().min(3).max(50).required(),
            status: Joi.number(),
            images: Joi.array(),
            basePrice: Joi.number(),
            //paymentCreatedAt: Joi.string(),
            //note: Joi.string(),
            rangePrice: Joi.array().items(
                Joi.object({
                    quantity: Joi.number().required(),
                    price: Joi.number().required(),
                    status: Joi.number().required()
                })
            ),
            options: Joi.array().items(
                Joi.object({
                    name: Joi.string().required(),
                    value: Joi.array().required(),
                    status: Joi.number().required()
                })
            ),
            //address: Joi.object(),
            productId: Joi.string().allow(null, ''),
            quantity: Joi.number(),
            isNew: Joi.boolean(),
            productDescription: Joi.string().required()
        })
    },

    uploadProductImages: {
        body: Joi.object({
            productId: Joi.string(),
            images: Joi.array(),
            imageUrl: Joi.array()
        })
    },

    // POST /api/order/createOrder
    createOrder: {
        body: Joi.object({
            productId: Joi.string().required(),
            userId: Joi.string(),
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone: Joi.string(),
            address: Joi.object().required(),
            status: Joi.number(),
            quantity: Joi.number().required(),
            note: Joi.string().allow(null, ''),
            mockup: Joi.string().allow(null, ''),
            artWork: Joi.string().allow(null, ''),
            paymentNote: Joi.string().allow(null, ''),
            paymentCreatedAt: Joi.string(),
            isNewUser: Joi.boolean(),
            deliveryNote: Joi.string().allow(null, ''),
            options: Joi.array().items(
                Joi.object({
                    name: Joi.string(),
                    value: Joi.string()
                })
            )
        })
    },

    uploadOrderImages: {
        body: Joi.object({
            _id: Joi.string(),
            mockup: Joi.string(),
            artWork: Joi.string()
        })
    },

    // PUT /api/order/updateOrder
    updateOrder: {
        body: Joi.object({
            productId: Joi.string(),
            _id: Joi.string().required(),
            userId: Joi.string(),
            name: Joi.string(),
            email: Joi.string().email(),
            phone: Joi.string(),
            address: Joi.object(),
            status: Joi.number(),
            amount: Joi.number(),
            quantity: Joi.number(),
            paymentStatus: Joi.string(),
            paymentAmount: Joi.number(),
            paymentNote: Joi.string(),
            deliveryNote: Joi.string(),
            options: Joi.array().items(
                Joi.object({
                    name: Joi.string(),
                    value: Joi.string()
                })
            )
        })
    },

    createEvent: {
        body: Joi.object({
            title: Joi.string().trim().min(3).max(255).required(),
            eventUrl: Joi.string().trim().min(3).max(255).required(),
            venue: Joi.object(),
            status: Joi.number(),
            eventImages: Joi.array(),
            noOfTickets: Joi.number(),
            maxTicketsPerUser: Joi.number(),
            ticketValue: Joi.number(),
            ticketDetails: Joi.object({
                maxTicketPerOrder: Joi.number(),
                ticketFare: Joi.number(),
                sellingStartDate: Joi.string(),
                sellingStartTime: Joi.string(),
                sellingEndDate: Joi.string(),
                sellingEndTime: Joi.string()
            }),
            eventStatus: Joi.string(),
            eventStartDate: Joi.string(),
            eventStartTime: Joi.string(),
            eventEndDate: Joi.string(),
            eventEndTime: Joi.string(),
            liveChatSupport: Joi.boolean(),
            eventDescription: Joi.string().required()
        })
    },

    uploadEventImages: {
        body: Joi.object({
            eventId: Joi.string(),
            eventImages: Joi.array(),
            EventImageUrl: Joi.array()
        })
    },

    // UPDATE /api/users/:userId
    updateUser: {
        body: Joi.object({
            username: Joi.string().required(),
            mobileNumber: Joi.string()
                .regex(/^[1-9][0-9]{9}$/)
                .required()
        }),
        params: Joi.object({
            userId: Joi.string().hex().required()
        })
    },

    // POST /api/auth/login
    login: {
        body: Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required()
        })
    },

    // POST /api/users/verifyOtp
    verifyOtp: {
        body: Joi.object({
            email: Joi.string(),
            type: Joi.string(),
            otp: Joi.string()
        })
    },
    // POST event/user/registration
    registerClubUser: {
        body: Joi.object()
            .keys({
                // name: Joi.string().min(3).max(25).required(),
                // email: Joi.string().email().required(),
                // mobile: Joi.string().min(3).max(10).required(),
                // isPaid: Joi.boolean().required(),
                // clubId: Joi.string(),
                // membershipUrl: Joi.string().max(150).required(),
                // membershipFee: Joi.when("isPaid", {
                // 	is: true,
                // 	then: Joi.number().required(),
                // 	otherwise: Joi.allow(null),
                // }),
            })
            .unknown()
            .required()
    },
    // POST event/user/registration
    createRegisterFormClubUser: {
        body: Joi.object({
            formFields: Joi.array().items(
                Joi.object().keys({
                    label: Joi.string().max(255).required('Field Label is required.'),
                    name: Joi.string().max(255).required('Field Name is required.'),
                    type: Joi.string().max(255).required('Field type is required.'),
                    order: Joi.number().required('order is required.'),
                    required: Joi.boolean().required('Required is required.'),
                    editable: Joi.boolean().required('Required is required.')
                })
            ),
            isPaid: Joi.boolean().required(),
            clubId: Joi.string(),
            membershipUrl: Joi.string().max(150).required(),
            membershipFee: Joi.when('isPaid', {
                is: true,
                then: Joi.number().required(),
                otherwise: Joi.allow(null)
            })
        })
    },

    eventBooking: {
        body: Joi.object({
            eventId: Joi.string().required(),
            userId: Joi.string().required()
        })
    }
};
