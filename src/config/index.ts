import path from "path";
export const TempFolderPath = path.resolve("temp", "uploads");

// User permission level
export const UserPermissonAction = {
    ADDPROJECT: [1, 2, 3],
    EDITPROJECT: [2, 3],
    DELPROJECT: [2],
    ADDSPACE: [1, 2, 3],
    EDITSPACE: [2, 3],
    DELSPACE: [2, 3],
    ADDTOPIC: [1, 2, 3],
    EDITTOPIC: [2, 3],
    DELTOPIC: [2, 3],
    ADDSUBSPACE: [1, 2, 3],
    EDITSUBSPACE: [2, 3],
    DELSUBSPACE: [2, 3],
    ADDCONTENT: [1, 2, 3],
    EDITCONTENT: [2, 3],
    DELCONTENT: [2, 3],
    VIEWALLTASK: [2, 3],
    VIEWALLAPPROVAL: [2, 3],
    VIEWALLCHATS: [2, 3],
    ADDTEAM: [2, 3],
    ADDCOLLAN: [2, 3],
};

export const AppUrl = "https://dev-platform.arkchat.com";
