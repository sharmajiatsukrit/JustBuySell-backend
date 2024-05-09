export enum SubscriberType {
    Individual = 1,
    Firm = 2,
}

export enum SubscriberServiceType {
    Default = 0,
    Service = 1,
    Product = 2,
}

export enum SubscriberProductType {
    Default = 0,
    Agent = 1,
    Distributor = 2,
    Dealer = 3
}

export enum SubscriberVerificationStatus {
    DEFAULT = 0,
    Verified = 1,
    Unverified = 2,
    InProcess = 3,
    Rejected = 4,
}

export enum SubscriberRouteEndPoints {
    Create = "Create",
    Edit = "Edit",
    AddUser = "AddUser",
    JoinUser = "JoinUser",
    AddUserToSub = "AddUserToSub",
    UserJoinToSub = "UserJoinToSub",
    PostUserJoinToSub="PostUserJoinToSub",
    RemoveUserSub = "RemoveUserSub",
    ExitUserSub = "ExitUserSub",
    UpdateUserPermisson = "UpdateUserPermisson",
    UpdateUserPaymentPermisson = "UpdateUserPaymentPermisson",
    AssignUserCredit = "AssignUserCredit",
    SwitchSubscriber = "SwitchSubscriber",
    RenameTopic = "RenameTopic",
    ProjectType = "ProjectType",
    UploadSubscriberImage = "UploadSubscriberImage"
}
