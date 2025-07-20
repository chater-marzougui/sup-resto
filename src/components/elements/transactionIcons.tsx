import { CreditCard, DollarSign, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { transactionTypeEnum } from '@/server/db/enums';

export const getTransactionIcon = (
    type: typeof transactionTypeEnum.enumValues[number],
    size: number = 24,
    color: string = 'currentColor'
) => {
    const Icon = (() => {
        switch (type) {
            case 'purchase':
                return CreditCard;
            case 'meal_redemption':
                return DollarSign;
            case 'balance_adjustment':
                return Settings;
            case 'refund':
                return CheckCircle;
            default:
                return AlertCircle;
        }
    })();

    return <Icon size={size} color={color} />;
};