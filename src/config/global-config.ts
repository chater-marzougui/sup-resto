import { RoleEnum, mealTypeEnum } from "@/server/db/enums"

export const MealCosts: Record<number, number> = {
    [RoleEnum.student]: 200,
    [RoleEnum.teacher]: 2000,
}

export const maxMealsInRed: Record<number, number> = {
    [RoleEnum.student]: 5,
    [RoleEnum.teacher]: 5,
}

export const mealTimeEnum: [number, number, number, number][] = [
    [11, 45, 0, 0],
    [17, 45, 0, 0],
];