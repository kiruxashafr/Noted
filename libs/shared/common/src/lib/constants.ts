import { UserPlan } from 'generated/prisma/client';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export const STORAGE_QUOTAS: Record<UserPlan, number> = {
    [UserPlan.FREE]: 100 * 1024 * 1024,
    [UserPlan.PREMIUM]: 1 * 1024 * 1024 * 1024,
    [UserPlan.PRO]: 10 * 1024 * 1024 * 1024, 
}