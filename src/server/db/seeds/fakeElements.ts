import { RoleEnum } from '../enums';
import bcrypt from 'bcrypt';
import type { StatusHistoryEntry } from '../schema';


const statusTypeEnum = {
  scheduled: 'scheduled',
  refunded: 'refunded',
  cancelled: 'cancelled',
  redeemed: 'redeemed',
  expired: 'expired',
} as const;


const mealTypeEnum = {
  lunch: 'lunch',
  dinner: 'dinner',
} as const;

type seedUsers = {
    id: string;
    cin: string;
    firstName: string;
    lastName: string;
    email: string | null;
    password: string;
    role: number;
    balance: number;
    isActive: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
}[]

export async function getFakeElements(seedUsers: seedUsers) {
    
    const adminUser = seedUsers.find(u => u.role === RoleEnum.admin)!;
    const paymentStaff = seedUsers.find(u => u.role === RoleEnum.paymentStaff)!;
    const verificationStaff = seedUsers.find(u => u.role === RoleEnum.verificationStaff)!;
    const students = seedUsers.filter(u => u.role === RoleEnum.student);
    const teachers = seedUsers.filter(u => u.role === RoleEnum.teacher);
    const normalUsers = seedUsers.filter(u => u.role === RoleEnum.normalUser);

    const mealScheduleData = [
        // Today's meals (some redeemed)
        {
            userId: students[0].id,
            mealTime: mealTypeEnum.lunch,
            scheduledDate: today,
            status: statusTypeEnum.redeemed,
            statusHistory: statusHistoryRedeemed,
        },
        {
            userId: students[0].id,
            mealTime: mealTypeEnum.dinner,
            scheduledDate: today,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: students[1].id,
            mealTime: mealTypeEnum.lunch,
            scheduledDate: today,
            status: statusTypeEnum.redeemed,
            statusHistory: statusHistoryRedeemed,
        },
        {
            userId: teachers[0].id,
            mealTime: mealTypeEnum.lunch,
            scheduledDate: today,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        
        // Tomorrow's meals
        {
            userId: students[0].id,
            mealTime: mealTypeEnum.lunch,
            scheduledDate: tomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: students[0].id,
            mealTime: mealTypeEnum.dinner,
            scheduledDate: tomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: students[1].id,
            mealTime: mealTypeEnum.lunch,
            scheduledDate: tomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: students[1].id,
            mealTime: mealTypeEnum.dinner,
            scheduledDate: tomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: students[2].id,
            mealTime: mealTypeEnum.lunch,
            scheduledDate: tomorrow,
            status: statusTypeEnum.cancelled,
            statusHistory: [
            {
                status: statusTypeEnum.scheduled,
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
            {
                status: statusTypeEnum.cancelled,
                timestamp: new Date().toISOString(),
            }
            ],
        },
        {
            userId: teachers[0].id,
            mealTime: mealTypeEnum.dinner,
            scheduledDate: tomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: teachers[1].id,
            mealTime: mealTypeEnum.lunch,
            scheduledDate: tomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        
        // Day after tomorrow
        {
            userId: students[3].id,
            mealTime: mealTypeEnum.lunch,
            scheduledDate: dayAfterTomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: students[3].id,
            mealTime: mealTypeEnum.dinner,
            scheduledDate: dayAfterTomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: normalUsers[0].id,
            mealTime: mealTypeEnum.lunch,
            scheduledDate: dayAfterTomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        ];

    const transactionData = [
        // meal_schedule transactions
        {
            userId: students[0].id,
            type: 'meal_schedule' as const,
            amount: '2500',
            processedBy: paymentStaff.id,
        },
        {
            userId: students[1].id,
            type: 'meal_schedule' as const,
            amount: '2000',
            processedBy: paymentStaff.id,
        },
        {
            userId: students[2].id,
            type: 'meal_schedule' as const,
            amount: '1500',
            processedBy: paymentStaff.id,
        },
        {
            userId: students[3].id,
            type: 'meal_schedule' as const,
            amount: '3000',
            processedBy: paymentStaff.id,
        },
        {
            userId: teachers[0].id,
            type: 'meal_schedule' as const,
            amount: '3500',
            processedBy: paymentStaff.id,
        },
        {
            userId: teachers[1].id,
            type: 'meal_schedule' as const,
            amount: '4000',
            processedBy: paymentStaff.id,
        },
        {
            userId: normalUsers[0].id,
            type: 'meal_schedule' as const,
            amount: '1000',
            processedBy: paymentStaff.id,
        },
        
        // Meal redemption transactions
        {
            userId: students[0].id,
            type: 'balance_recharge' as const,
            amount: '6600',
            processedBy: verificationStaff.id,
        },
        {
            userId: students[1].id,
            type: 'balance_recharge' as const,
            amount: '4000',
            processedBy: verificationStaff.id,
        },
        
        // Refund transaction
        {
            userId: students[2].id,
            type: 'refund' as const,
            amount: '200',
            processedBy: paymentStaff.id,
        },
        
        // Balance adjustment
        {
            userId: students[4].id,
            type: 'balance_adjustment' as const,
            amount: '-1000',
            processedBy: adminUser.id,
        },
        ];

    const syncLogData = [
        // Successful syncs
        {
            userId: students[0].id,
            syncType: 'full',
            success: true,
            recordsAffected: 5,
        },
        {
            userId: students[1].id,
            syncType: 'incremental',
            success: true,
            recordsAffected: 2,
        },
        {
            userId: teachers[0].id,
            syncType: 'push',
            success: true,
            recordsAffected: 1,
        },
        {
            userId: students[2].id,
            syncType: 'full',
            success: true,
            recordsAffected: 3,
        },
        
        // Failed sync
        {
            userId: students[3].id,
            syncType: 'incremental',
            success: false,
            errorMessage: 'Network timeout during sync',
            recordsAffected: 0,
        },
        {
            userId: normalUsers[0].id,
            syncType: 'full',
            success: false,
            errorMessage: 'Authentication failed',
            recordsAffected: 0,
        },
        ];

  return {
    mealScheduleData,
    transactionData,
    syncLogData,
  };
}
const saltRounds = 10;

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

const statusHistoryScheduled: StatusHistoryEntry[] = [
    {
    status: statusTypeEnum.scheduled, 
    timestamp: new Date().toISOString(),
    }
];

const statusHistoryRedeemed: StatusHistoryEntry[] = [
    {
        status: statusTypeEnum.scheduled,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        status: statusTypeEnum.redeemed, 
        timestamp: new Date().toISOString(),
    }
];

export async function createSeedUsers() {

    const usersToSeed = [
        {
            cin: '00000001',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin.user@university.edu',
            role: RoleEnum.admin,
            balance: 0,
            isActive: true,
            password: await bcrypt.hash('00000001', saltRounds),
        },
        {
            cin: '00000002',
            firstName: 'Ahmed',
            lastName: 'Ben Ali',
            email: 'ahmed.benali@university.edu',
            role: RoleEnum.paymentStaff,
            balance: 1000,
            isActive: true,
            password: await bcrypt.hash('00000002', saltRounds),
        },
        // Verification staff
        {
            cin: '00000003',
            firstName: 'Fatima',
            lastName: 'Gharbi',
            email: 'fatima.gharbi@university.edu',
            role: RoleEnum.verificationStaff,
            balance: 2000,
            isActive: true,
            password: await bcrypt.hash('00000003', saltRounds),
        },
        // Teachers
        {
            cin: '00000005',
            firstName: 'Mohamed',
            lastName: 'Trabelsi',
            email: 'mohamed.trabelsi@university.edu',
            role: RoleEnum.teacher,
            balance: 1500,
            isActive: true,
            password: await bcrypt.hash('00000005', saltRounds),
        },
        {
            cin: '00000015',
            firstName: 'Aisha',
            lastName: 'Khadija',
            email: 'aisha.khadija@university.edu',
            role: RoleEnum.teacher,
            balance: 2200,
            isActive: true,
            password: await bcrypt.hash('00000015', saltRounds),
        },
        // Students
        {
            cin: '00000004',
            firstName: 'Youssef',
            lastName: 'Mahmoud',
            email: 'youssef.mahmoud@student.edu',
            role: RoleEnum.student,
            balance: 1000,
            isActive: true,
            password: await bcrypt.hash('00000004', saltRounds),
        },
        {
            cin: '12345679',
            firstName: 'Leila',
            lastName: 'Sassi',
            email: 'leila.sassi@student.edu',
            role: RoleEnum.student,
            balance: 800,
            isActive: true,
            password: await bcrypt.hash('12345679', saltRounds),
        },
        {
            cin: '11223344',
            firstName: 'Omar',
            lastName: 'Jemli',
            email: 'omar.jemli@student.edu',
            role: RoleEnum.student,
            balance: 500,
            isActive: true,
            password: await bcrypt.hash('11223344', saltRounds),
        },
        {
            cin: '99887766',
            firstName: 'Nour',
            lastName: 'Bouali',
            email: 'nour.bouali@student.edu',
            role: RoleEnum.student,
            balance: 1200,
            isActive: true,
            password: await bcrypt.hash('99887766', saltRounds),
        },
        {
            cin: '12721079',
            firstName: 'Karim',
            lastName: 'Zouari',
            email: 'karim.zouari@student.edu',
            role: RoleEnum.student,
            balance: 300,
            isActive: false,
            password: await bcrypt.hash('12721079', saltRounds), // Inactive student
        },
        // Normal users
        {
            cin: '00000006',
            firstName: 'Sami',
            lastName: 'Hamdi',
            role: RoleEnum.normalUser,
            email: 'sami.hamdi@student.edu',
            balance: 200,
            isActive: true,
            password: await bcrypt.hash('00000006', saltRounds),
        }
    ];
    return usersToSeed;
}