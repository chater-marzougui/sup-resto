import { CreditCard, DollarSign, Settings, CheckCircle, AlertCircle, Calendar1Icon } from 'lucide-react';
import { transactionTypeEnum } from '@/server/db/enums';

export const getTransactionIcon = (
    type: typeof transactionTypeEnum.enumValues[number],
    size: number = 24,
    color: string = 'currentColor'
) => {
    const Icon = (() => {
        switch (type) {
            case 'balance_recharge':
                return CreditCard;
            case 'meal_schedule':
                return Calendar1Icon;
            case 'meal_redemption':
                return CheckCircle;
            case 'balance_adjustment':
                return Settings;
            case 'refund':
                return DollarSign;
            default:
                return AlertCircle;
        }
    })();

    return <Icon size={size} color={color} />;
};