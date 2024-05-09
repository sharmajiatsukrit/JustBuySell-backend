import { UserAccountStatus } from "../enums/user";

export interface SessionManageData {
    session_id: number;
    user_id: number;
    token: string;
    status: UserAccountStatus.Active | UserAccountStatus.Blocked | UserAccountStatus.Deactive | UserAccountStatus.SoftDeleted | UserAccountStatus.Default;
    is_valid: boolean;
}

export interface SessionFetchData {
    session_id: number;
    user_id: number;
}
