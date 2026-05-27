"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentSubmitSchema = void 0;
const zod_1 = require("zod");
exports.paymentSubmitSchema = zod_1.z.object({
    cardNumber: zod_1.z.string().regex(/^\d{16}$/),
    expiry: zod_1.z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
    cardHolder: zod_1.z.string().min(2).max(100),
    cvv: zod_1.z.string().regex(/^\d{3,4}$/),
});
