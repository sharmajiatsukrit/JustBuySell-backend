export interface UserData {
    id: number;
    email: string;
    is_email_verified: boolean;
    communication_email: string;
    first_name: string;
    last_name: string;
    img: string;
    username: string;
    password: string;
    mobile_number_country_code: string;
    mobile_number: string;
    is_mobile_number_verified: boolean;
    date_of_birth: string;
    country_code: string;
    country: string;
    language_code: string;
    language: string;
    city: string;
    account_status: number;
    tax_id: string;
    address: string;
    subscribed_to: number[];
    active_subscriber: number;
    date_format: string;
    is_profile_journey_completed: boolean;
    is_first_group_created: boolean;
    is_first_invite_sent: boolean;
    is_welcome_journey_completed: boolean;
    token?: string;
}

export interface UserInfoType {
    id: number;
    email: string;
    communication_email: string;
    first_name: string;
    last_name: string;
    img: string;
    username: string;
    is_email_verified: boolean;
    mobile_number_country_code: string;
    mobile_number: string;
    is_mobile_number_verified: boolean;
    date_of_birth: string;
    country_code: string;
    country: string;
    language_code: string;
    language: string;
    city: string;
    tax_id: string;
    address: string;
    subscribed_to?: number[];
    active_subscriber: number;
    date_format: string;
    time_format: string;
    view_mobile_journey: boolean;
    createdAt: string;
    updatedAt: string;
    is_profile_journey_completed: boolean;
    is_first_group_created: boolean;
    is_first_invite_sent: boolean;
    is_welcome_journey_completed: boolean;
    activePermission: number;
    activeSubscriber: SubscribedToEntityOrActiveSubscriber;
    subscribedTo?: SubscribedToEntityOrActiveSubscriber[];
}
export interface SubscribedToEntityOrActiveSubscriber {
    id: number;
    subscriber_account_type: string;
    subscriber_account_type_slug: string;
    subscriber_account_industry: string;
    subscriber_account_industry_slug: string;
    subscriber_account_expertise: string;
    subscriber_priority: number;
    collaborators?: [];
    subscriber_firm_name: string;
    img: string;
    website: string;
    social_handles?: {};
    country_code: string;
    country: string;
    city: string;
    account_owner: string;
    admin_users?: number[];
    topic_name: string;
    project_type: number;
}
export interface HandledBy {
    user_id: number;
    job_title: string;
}
