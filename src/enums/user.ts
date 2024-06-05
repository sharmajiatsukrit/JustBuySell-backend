export enum UserAccountStatus {
    Default = 0,
    Active = 1,
    Deactive = 2,
    Blocked = 3,
    SoftDeleted = 4,
}

export enum UserRouteEndPoints {
    Register = "Register",
    SocialSignIn = "SocialSignIn",
    UploadUserImage="UploadUserImage",
    SignIn = "SignIn",
    Login = "Login",
    ForgetPassword = "ForgetPassword",
    ResetPassword = "ResetPassword",
    ResetOldPassword = "ResetOldPassword",
    VERIFYEMAIL = "VERIFYEMAIL",
    Delete = "Delete",
    Getlist="Getlist",
    getLimitlist="getLimitlist",
    Getlimitlist="Getlimitlist",
    Getsearch="Getsearch",
    Addproductrequest="Addproductrequest",
}

export enum AdminRouteEndPoints {
    SignIn = "SignIn"
}

export enum SocialType {
    google = 1,
    apple = 2,
    facebook = 3,
    linkedin = 4,
}

export enum UserAccountType {
    Individual = 1,
    Member = 2,
    Collaborator = 3,
}

export enum UserPermssionType {
    User = 1,
    Admin = 2, // Super Admin
    Manager = 3, // Manager
    Accountant = 4,
}

export enum UserInviteType {
    Owner = 0,
    Internal = 1,
    External = 2
}
