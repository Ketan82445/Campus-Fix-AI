"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var deptIT, deptElectrical, deptPlumbing, deptHousekeeping, deptFacilities, deptSecurity, defaultPasswordHash, adminUser, techNetwork, techElec, techPlumb, techClean, student1, student2, cmp1, cmp2, cmp3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Starting database seed...');
                    // 1. Clean existing records in reverse order
                    return [4 /*yield*/, prisma.complaintComment.deleteMany()];
                case 1:
                    // 1. Clean existing records in reverse order
                    _a.sent();
                    return [4 /*yield*/, prisma.auditLog.deleteMany()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.notification.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.aIPrediction.deleteMany()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.statusHistory.deleteMany()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.assignment.deleteMany()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.complaint.deleteMany()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, prisma.department.deleteMany()];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, prisma.department.create({
                            data: {
                                name: 'IT & Network Services',
                                code: 'IT_NETWORK',
                                description: 'Handles Wi-Fi, ethernet, server, software and network hardware issues.'
                            }
                        })];
                case 10:
                    deptIT = _a.sent();
                    return [4 /*yield*/, prisma.department.create({
                            data: {
                                name: 'Electrical Maintenance',
                                code: 'ELECTRICAL',
                                description: 'Handles wiring, power outages, switches, fans, lighting and electrical fixtures.'
                            }
                        })];
                case 11:
                    deptElectrical = _a.sent();
                    return [4 /*yield*/, prisma.department.create({
                            data: {
                                name: 'Plumbing & Sanitation',
                                code: 'PLUMBING',
                                description: 'Handles water leaks, washrooms, pipe bursts, drainage and water supply.'
                            }
                        })];
                case 12:
                    deptPlumbing = _a.sent();
                    return [4 /*yield*/, prisma.department.create({
                            data: {
                                name: 'Housekeeping & Cleaning',
                                code: 'CLEANING',
                                description: 'Handles cleanliness, waste management, classroom hygiene and washroom sanitization.'
                            }
                        })];
                case 13:
                    deptHousekeeping = _a.sent();
                    return [4 /*yield*/, prisma.department.create({
                            data: {
                                name: 'Infrastructure & Facilities',
                                code: 'INFRASTRUCTURE',
                                description: 'Handles furniture, doors, windows, classroom projectors, boards and structural damage.'
                            }
                        })];
                case 14:
                    deptFacilities = _a.sent();
                    return [4 /*yield*/, prisma.department.create({
                            data: {
                                name: 'Campus Security',
                                code: 'SECURITY',
                                description: 'Handles security concerns, unauthorized access, lost items and safety hazards.'
                            }
                        })];
                case 15:
                    deptSecurity = _a.sent();
                    console.log('✅ Departments created.');
                    return [4 /*yield*/, bcrypt.hash('Password123!', 10)];
                case 16:
                    defaultPasswordHash = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: 'System Admin',
                                email: 'admin@campusfix.local',
                                passwordHash: defaultPasswordHash,
                                role: client_1.Role.ADMIN,
                                phone: '+91 9876543210'
                            }
                        })];
                case 17:
                    adminUser = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: 'Alex Network',
                                email: 'tech.network@campusfix.local',
                                passwordHash: defaultPasswordHash,
                                role: client_1.Role.TECHNICIAN,
                                phone: '+91 9876543211',
                                departmentId: deptIT.id
                            }
                        })];
                case 18:
                    techNetwork = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: 'Bob Sparks',
                                email: 'tech.elec@campusfix.local',
                                passwordHash: defaultPasswordHash,
                                role: client_1.Role.TECHNICIAN,
                                phone: '+91 9876543212',
                                departmentId: deptElectrical.id
                            }
                        })];
                case 19:
                    techElec = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: 'Charlie Pipes',
                                email: 'tech.plumb@campusfix.local',
                                passwordHash: defaultPasswordHash,
                                role: client_1.Role.TECHNICIAN,
                                phone: '+91 9876543213',
                                departmentId: deptPlumbing.id
                            }
                        })];
                case 20:
                    techPlumb = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: 'David Clean',
                                email: 'tech.housekeeping@campusfix.local',
                                passwordHash: defaultPasswordHash,
                                role: client_1.Role.TECHNICIAN,
                                phone: '+91 9876543214',
                                departmentId: deptHousekeeping.id
                            }
                        })];
                case 21:
                    techClean = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: 'Rahul Sharma',
                                email: 'student1@campusfix.local',
                                passwordHash: defaultPasswordHash,
                                role: client_1.Role.STUDENT,
                                phone: '+91 9876543215'
                            }
                        })];
                case 22:
                    student1 = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: 'Priya Patel',
                                email: 'student2@campusfix.local',
                                passwordHash: defaultPasswordHash,
                                role: client_1.Role.STUDENT,
                                phone: '+91 9876543216'
                            }
                        })];
                case 23:
                    student2 = _a.sent();
                    console.log('✅ Users created.');
                    return [4 /*yield*/, prisma.complaint.create({
                            data: {
                                complaintNumber: 'CMP-2026-001',
                                title: 'Wi-Fi not working in Computer Lab 3',
                                description: 'Internet has stopped working completely in Computer Lab 3 since morning. Students are unable to access lab assignments.',
                                category: client_1.Category.IT_NETWORK,
                                priority: client_1.Priority.HIGH,
                                location: 'Computer Lab 3, CS Block 2nd Floor',
                                status: client_1.Status.ASSIGNED,
                                aiConfidence: 0.94,
                                createdById: student1.id,
                                departmentId: deptIT.id,
                                assignedTechnicianId: techNetwork.id,
                                statusHistory: {
                                    create: [
                                        { oldStatus: null, newStatus: client_1.Status.SUBMITTED, reason: 'Complaint submitted by student', changedById: student1.id },
                                        { oldStatus: client_1.Status.SUBMITTED, newStatus: client_1.Status.AI_ANALYZING, reason: 'AI processing complaint', changedById: null },
                                        { oldStatus: client_1.Status.AI_ANALYZING, newStatus: client_1.Status.ASSIGNED, reason: 'Auto-routed to IT & assigned to Alex Network', changedById: adminUser.id }
                                    ]
                                },
                                aiPredictions: {
                                    create: [
                                        {
                                            predictedCategory: client_1.Category.IT_NETWORK,
                                            predictedPriority: client_1.Priority.HIGH,
                                            predictedDepartment: 'IT & Network Services',
                                            confidence: 0.94,
                                            modelVersion: 'campusfix-v1',
                                            predictionIndicators: JSON.stringify(['Wi-Fi', 'Internet', 'Computer Lab', 'access']),
                                            status: 'SUCCESS'
                                        }
                                    ]
                                },
                                assignments: {
                                    create: [
                                        {
                                            technicianId: techNetwork.id,
                                            assignedById: adminUser.id,
                                            notes: 'Check access point router in Lab 3'
                                        }
                                    ]
                                }
                            }
                        })];
                case 24:
                    cmp1 = _a.sent();
                    return [4 /*yield*/, prisma.complaint.create({
                            data: {
                                complaintNumber: 'CMP-2026-002',
                                title: 'Water leakage near 2nd floor washroom',
                                description: 'Major water leakage from pipe in the 2nd floor corridor washroom, causing slippery floor.',
                                category: client_1.Category.PLUMBING,
                                priority: client_1.Priority.HIGH,
                                location: 'Main Academic Building, 2nd Floor Washroom',
                                status: client_1.Status.IN_PROGRESS,
                                aiConfidence: 0.89,
                                createdById: student2.id,
                                departmentId: deptPlumbing.id,
                                assignedTechnicianId: techPlumb.id,
                                statusHistory: {
                                    create: [
                                        { oldStatus: null, newStatus: client_1.Status.SUBMITTED, reason: 'Complaint submitted by student', changedById: student2.id },
                                        { oldStatus: client_1.Status.SUBMITTED, newStatus: client_1.Status.ASSIGNED, reason: 'Assigned to plumbing technician', changedById: adminUser.id },
                                        { oldStatus: client_1.Status.ASSIGNED, newStatus: client_1.Status.IN_PROGRESS, reason: 'Technician started repairing pipe', changedById: techPlumb.id }
                                    ]
                                },
                                assignments: {
                                    create: [
                                        {
                                            technicianId: techPlumb.id,
                                            assignedById: adminUser.id,
                                            status: 'IN_PROGRESS',
                                            notes: 'Inspecting main supply valve'
                                        }
                                    ]
                                }
                            }
                        })];
                case 25:
                    cmp2 = _a.sent();
                    return [4 /*yield*/, prisma.complaint.create({
                            data: {
                                complaintNumber: 'CMP-2026-003',
                                title: 'Broken fan switch in Room 204',
                                description: 'The ceiling fan switch in Room 204 is loose and sparking when turned on.',
                                category: client_1.Category.ELECTRICAL,
                                priority: client_1.Priority.MEDIUM,
                                location: 'Room 204, Mechanical Block',
                                status: client_1.Status.RESOLVED,
                                aiConfidence: 0.91,
                                createdById: student1.id,
                                departmentId: deptElectrical.id,
                                assignedTechnicianId: techElec.id,
                                resolvedAt: new Date(),
                                statusHistory: {
                                    create: [
                                        { oldStatus: null, newStatus: client_1.Status.SUBMITTED, reason: 'Complaint created', changedById: student1.id },
                                        { oldStatus: client_1.Status.SUBMITTED, newStatus: client_1.Status.ASSIGNED, reason: 'Assigned to Bob Sparks', changedById: adminUser.id },
                                        { oldStatus: client_1.Status.ASSIGNED, newStatus: client_1.Status.IN_PROGRESS, reason: 'Work started', changedById: techElec.id },
                                        { oldStatus: client_1.Status.IN_PROGRESS, newStatus: client_1.Status.RESOLVED, reason: 'Replaced fan switchboard', changedById: techElec.id }
                                    ]
                                },
                                assignments: {
                                    create: [
                                        {
                                            technicianId: techElec.id,
                                            assignedById: adminUser.id,
                                            status: 'COMPLETED',
                                            notes: 'Switchboard replaced successfully'
                                        }
                                    ]
                                }
                            }
                        })];
                case 26:
                    cmp3 = _a.sent();
                    console.log('✅ Sample complaints created.');
                    // 6. Audit Log
                    return [4 /*yield*/, prisma.auditLog.create({
                            data: {
                                actorId: adminUser.id,
                                action: 'SYSTEM_SEEDED',
                                entityType: 'SYSTEM',
                                metadata: JSON.stringify({ seededAt: new Date() })
                            }
                        })];
                case 27:
                    // 6. Audit Log
                    _a.sent();
                    console.log('🎉 Database seeding complete!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Seeding error:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
