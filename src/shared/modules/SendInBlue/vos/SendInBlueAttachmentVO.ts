
export default class SendInBlueAttachmentVO {
    public static createNew(
        name: string,
        url: string
    ): SendInBlueAttachmentVO {
        let res: SendInBlueAttachmentVO = new SendInBlueAttachmentVO();

        res.name = name;
        res.url = url;

        return res;
    }

    public name: string;
    public url: string;
}