import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { cloneDeep } from 'lodash';
import TsxComponent, { createProps } from 'components/tsx-component';
import { formMetadata, metadata } from '../../shared/inputs';
import { $t } from '../../../services/i18n';
import BroadcastInput from './BroadcastInput';
import {
  IYoutubeLiveBroadcast,
  IYoutubeStartStreamOptions,
  YoutubeService,
} from 'services/platforms/youtube';
import CommonPlatformFields from '../CommonPlatformFields';
import { StreamingService } from '../../../app-services';

class YoutubeEditStreamInfoProps {
  value?: IYoutubeStartStreamOptions = {
    description: '',
    title: '',
    broadcastId: '',
  };
}

@Component({ components: { ValidatedForm }, props: createProps(YoutubeEditStreamInfoProps) })
export default class YoutubeEditStreamInfo extends TsxComponent<YoutubeEditStreamInfoProps> {
  @Inject() private youtubeService: YoutubeService;
  @Inject() private streamingService: StreamingService;
  settings: IYoutubeStartStreamOptions = null;
  broadcasts: IYoutubeLiveBroadcast[] = [];
  broadcastsLoaded = false;

  async created() {
    this.settings = cloneDeep(this.props.value);
    this.broadcasts = await this.youtubeService.fetchBroadcasts();
    this.broadcastsLoaded = true;
  }

  get canChangeBroadcast() {
    return this.streamingService.isStreaming;
  }

  get view() {
    return this.streamingService.views;
  }

  @Watch('value')
  syncValue(val: IYoutubeStartStreamOptions) {
    this.settings = cloneDeep(val);
  }

  onSelectBroadcastHandler() {
    // set title and description fields from selected broadcast
    const selectedBroadcast = this.broadcasts.find(
      broadcast => broadcast.id === this.settings.broadcastId,
    );
    if (!selectedBroadcast) return;
    const { title, description } = selectedBroadcast.snippet;
    this.settings.title = title;
    this.settings.description = description;
  }

  get formMetadata() {
    return formMetadata({
      title: metadata.text({
        title: $t('Title'),
        fullWidth: true,
        required: true,
      }),
      description: metadata.textArea({
        title: $t('Description'),
        fullWidth: true,
      }),
      event: {
        broadcasts: this.broadcasts,
        loading: !this.broadcastsLoaded,
        disabled: !this.canChangeBroadcast,
      },
    });
  }

  emitInput() {
    this.$emit('input', this.settings);
  }

  render() {
    const canShowOnlyRequiredFields = this.streamingService.views.canShowOnlyRequiredFields;
    return (
      !canShowOnlyRequiredFields && (
        <ValidatedForm onInput={this.emitInput}>
          {this.canChangeBroadcast && (
            <HFormGroup title={$t('Event')}>
              <BroadcastInput
                onInput={this.onSelectBroadcastHandler}
                vModel={this.settings.broadcastId}
                metadata={this.formMetadata.event}
              />
            </HFormGroup>
          )}
          <CommonPlatformFields
            vModel={this.settings}
            hasCustomCheckbox={this.view.isMutliplatformMode}
            platforms={['youtube']}
          />
        </ValidatedForm>
      )
    );
  }
}
