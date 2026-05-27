"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshRequestSchema = exports.identifyRequestSchema = void 0;
const zod_1 = require("zod");
exports.identifyRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    fingerprintToken: zod_1.z.string().uuid(),
    extraMeta: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.refreshRequestSchema = zod_1.z.object({});
