import INamedVO from '../../../interfaces/INamedVO';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';

export default class AnimationQRVO implements IWeightedItem, INamedVO {

    public static API_TYPE_ID: string = "anim_qr";

    public id: number;
    public _type: string = AnimationQRVO.API_TYPE_ID;

    public description: string;
    public reponses: string;
    public explicatif: string;
    public external_video: string;

    public name: string;
    public weight: number;

    public question_file_id: number;
    public reponse_file_id: number;
    public module_id: number;
}