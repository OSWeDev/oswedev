import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ImageVO from '../../../../shared/modules/Image/vos/ImageVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import { ModuleDAOAction } from '../../../ts/components/dao/store/DaoStore';
import VueComponentBase from '../../../ts/components/VueComponentBase';

@Component({
    template: require('./ImageComponent.pug'),
    components: {}
})
export default class ImageComponent extends VueComponentBase {

    private static __UID: number = 1;

    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @Prop({ default: false })
    protected readonly: boolean;

    @Prop({ default: null })
    protected imagevo: ImageVO;

    @Prop({ default: null })
    protected options: any;

    @Prop({ default: false })
    protected muted: boolean;

    protected uid: number = null;

    @Watch('imagevo')
    public async updateImageVO() {
        let dropzone = (this.$refs['filedropzone' + this.uid] as any);

        if (!dropzone) {
            return;
        }
        dropzone.removeAllFiles();
        if (!this.imagevo) {
            return;
        }

        var mock = {
            accepted: true,
            name: this.imagevo.path.replace(/^.*[\\/]([^\\/]+)$/, '$1'),
            url: this.imagevo.path
        };

        mock.accepted = true;

        dropzone.files.push(mock);
        dropzone.emit('addedfile', mock);
        dropzone.createThumbnailFromUrl(mock, mock.url);
        dropzone.emit('complete', mock);
    }

    public async mounted() {
        this.uid = ImageComponent.__UID++;
    }

    get dropzoneOptions() {
        let self = this;


        let onInit = (!!this.options) ? this.options.init : null;
        let onSuccess = (!!this.options) ? this.options.success : null;
        let dropoptions = {
            url: '/ModuleImageServer/upload',
            createImageThumbnails: true,
            maxFiles: 1,
            clickable: true,
            dictDefaultMessage: self.label('dropzone.dictDefaultMessage'),
            dictFallbackMessage: self.label('dropzone.dictFallbackMessage'),
            dictFallbackText: self.label('dropzone.dictFallbackText'),
            dictFileTooBig: self.label('dropzone.dictFileTooBig'),
            dictInvalidFileType: self.label('dropzone.dictInvalidFileType'),
            dictResponseError: self.label('dropzone.dictResponseError'),
            dictCancelUpload: self.label('dropzone.dictCancelUpload'),
            dictUploadCanceled: self.label('dropzone.dictUploadCanceled'),
            dictCancelUploadConfirmation: self.label('dropzone.dictCancelUploadConfirmation'),
            dictRemoveFile: self.label('dropzone.dictRemoveFile'),
            dictRemoveFileConfirmation: self.label('dropzone.dictRemoveFileConfirmation'),
            dictMaxFilesExceeded: self.label('dropzone.dictMaxFilesExceeded'),
            dictFileSizeUnits: self.label('dropzone.dictFileSizeUnits'),
            init: function () {

                this.on('maxfilesexceeded', function (file) {
                    this.removeAllFiles();
                    this.addFile(file);
                });

                try {
                    if (!!onInit) {
                        onInit();
                    }
                } catch (error) {
                    self.snotify.error(self.label('import.server_response_error'));
                    return;
                }
            },
            success: async (infos, res) => {

                try {
                    let newvo = JSON.parse(res);
                    self.storeData(newvo);
                    self.$emit('uploaded', newvo);

                    if (!!onSuccess) {
                        onSuccess(infos, res);
                    }
                    (self.$refs['filedropzone' + this.uid] as any).removeAllFiles();
                } catch (error) {
                    self.snotify.error(self.label('import.server_response_error'));
                    return;
                }
            }
        };

        return Object.assign(dropoptions, this.options);
    }
}