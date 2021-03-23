
export default class AddRoleToUserParamVO {

    public static async translateCheckAccessParams(
        user_id: number,
        role_id: number): Promise<AddRoleToUserParamVO> {

        return new AddRoleToUserParamVO(user_id, role_id);
    }

    public constructor(
        public user_id: number,
        public role_id: number) {
    }
}