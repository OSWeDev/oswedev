import IInstantiatedPageComponent from '../interfaces/IInstantiatedPageComponent';

export default class HtmlHtmlComponentVO implements IInstantiatedPageComponent {
    public static API_TYPE_ID: string = "html_html_cmpnt";

    public id: number;
    public _type: string = HtmlHtmlComponentVO.API_TYPE_ID;

    public page_id: number;
    public weight: number;

    public left_html: string;
    public right_html: string;
}