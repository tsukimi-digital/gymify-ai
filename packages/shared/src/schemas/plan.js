"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planGenerateSchema = void 0;
const zod_1 = require("zod");
exports.planGenerateSchema = zod_1.z.object({
    reason: zod_1.z.string().max(300).optional(),
});
