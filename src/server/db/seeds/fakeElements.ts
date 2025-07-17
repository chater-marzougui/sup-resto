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


const mealTimeEnum = {
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
            mealTime: mealTimeEnum.lunch,
            scheduledDate: today,
            status: statusTypeEnum.redeemed,
            statusHistory: statusHistoryRedeemed,
        },
        {
            userId: students[0].id,
            mealTime: mealTimeEnum.dinner,
            scheduledDate: today,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: students[1].id,
            mealTime: mealTimeEnum.lunch,
            scheduledDate: today,
            status: statusTypeEnum.redeemed,
            statusHistory: statusHistoryRedeemed,
        },
        {
            userId: teachers[0].id,
            mealTime: mealTimeEnum.lunch,
            scheduledDate: today,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        
        // Tomorrow's meals
        {
            userId: students[0].id,
            mealTime: mealTimeEnum.lunch,
            scheduledDate: tomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: students[0].id,
            mealTime: mealTimeEnum.dinner,
            scheduledDate: tomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: students[1].id,
            mealTime: mealTimeEnum.lunch,
            scheduledDate: tomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: students[1].id,
            mealTime: mealTimeEnum.dinner,
            scheduledDate: tomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: students[2].id,
            mealTime: mealTimeEnum.lunch,
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
            mealTime: mealTimeEnum.dinner,
            scheduledDate: tomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: teachers[1].id,
            mealTime: mealTimeEnum.lunch,
            scheduledDate: tomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        
        // Day after tomorrow
        {
            userId: students[3].id,
            mealTime: mealTimeEnum.lunch,
            scheduledDate: dayAfterTomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: students[3].id,
            mealTime: mealTimeEnum.dinner,
            scheduledDate: dayAfterTomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        {
            userId: normalUsers[0].id,
            mealTime: mealTimeEnum.lunch,
            scheduledDate: dayAfterTomorrow,
            status: statusTypeEnum.scheduled,
            statusHistory: statusHistoryScheduled,
        },
        ];

    const transactionData = [
        // Purchase transactions
        {
            userId: students[0].id,
            type: 'purchase' as const,
            amount: '25.00',
            processedBy: paymentStaff.id,
        },
        {
            userId: students[1].id,
            type: 'purchase' as const,
            amount: '20.00',
            processedBy: paymentStaff.id,
        },
        {
            userId: students[2].id,
            type: 'purchase' as const,
            amount: '15.00',
            processedBy: paymentStaff.id,
        },
        {
            userId: students[3].id,
            type: 'purchase' as const,
            amount: '30.00',
            processedBy: paymentStaff.id,
        },
        {
            userId: teachers[0].id,
            type: 'purchase' as const,
            amount: '35.00',
            processedBy: paymentStaff.id,
        },
        {
            userId: teachers[1].id,
            type: 'purchase' as const,
            amount: '40.00',
            processedBy: paymentStaff.id,
        },
        {
            userId: normalUsers[0].id,
            type: 'purchase' as const,
            amount: '10.00',
            processedBy: paymentStaff.id,
        },
        
        // Meal redemption transactions
        {
            userId: students[0].id,
            type: 'meal_redemption' as const,
            amount: '-2.50',
            processedBy: verificationStaff.id,
        },
        {
            userId: students[1].id,
            type: 'meal_redemption' as const,
            amount: '-2.50',
            processedBy: verificationStaff.id,
        },
        
        // Refund transaction
        {
            userId: students[2].id,
            type: 'refund' as const,
            amount: '2.50',
            processedBy: paymentStaff.id,
        },
        
        // Balance adjustment
        {
            userId: students[4].id,
            type: 'balance_adjustment' as const,
            amount: '-10.00',
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
            cin: 'ADM001',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin.user@university.edu',
            role: RoleEnum.admin,
            balance: 0,
            isActive: true,
            password: await bcrypt.hash('ADM001', saltRounds),
        },
        {
            cin: 'PAY001',
            firstName: 'Ahmed',
            lastName: 'Ben Ali',
            email: 'ahmed.benali@university.edu',
            role: RoleEnum.paymentStaff,
            balance: 1000,
            isActive: true,
            password: await bcrypt.hash('PAY001', saltRounds),
        },
        // Verification staff
        {
            cin: 'VER001',
            firstName: 'Fatima',
            lastName: 'Gharbi',
            email: 'fatima.gharbi@university.edu',
            role: RoleEnum.verificationStaff,
            balance: 2000,
            isActive: true,
            password: await bcrypt.hash('VER001', saltRounds),
        },
        // Teachers
        {
            cin: 'TCH001',
            firstName: 'Mohamed',
            lastName: 'Trabelsi',
            email: 'mohamed.trabelsi@university.edu',
            role: RoleEnum.teacher,
            balance: 1500,
            isActive: true,
            password: await bcrypt.hash('TCH001', saltRounds),
        },
        {
            cin: 'TCH002',
            firstName: 'Aisha',
            lastName: 'Khadija',
            email: 'aisha.khadija@university.edu',
            role: RoleEnum.teacher,
            balance: 2200,
            isActive: true,
            password: await bcrypt.hash('TCH002', saltRounds),
        },
        // Students
        {
            cin: '12345678',
            firstName: 'Youssef',
            lastName: 'Mahmoud',
            email: 'youssef.mahmoud@student.edu',
            role: RoleEnum.student,
            balance: 1000,
            isActive: true,
            password: await bcrypt.hash('12345678', saltRounds),
        },
        {
            cin: '87654321',
            firstName: 'Leila',
            lastName: 'Sassi',
            email: 'leila.sassi@student.edu',
            role: RoleEnum.student,
            balance: 800,
            isActive: true,
            password: await bcrypt.hash('87654321', saltRounds),
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
            cin: '55443322',
            firstName: 'Karim',
            lastName: 'Zouari',
            email: 'karim.zouari@student.edu',
            role: RoleEnum.student,
            balance: 300,
            isActive: false,
            password: await bcrypt.hash('55443322', saltRounds), // Inactive student
        },
        // Normal users
        {
            cin: 'NRM001',
            firstName: 'Sami',
            lastName: 'Hamdi',
            role: RoleEnum.normalUser,
            email: 'sami.hamdi@student.edu',
            balance: 200,
            isActive: true,
            password: await bcrypt.hash('NRM001', saltRounds),
        }
    ];
    return usersToSeed;
}