(function () {
  function grapesjsPluginLocalVideo(editor) {
    const domc = editor.DomComponents;
    const bm = editor.BlockManager;

    const videoType = domc.getType('video');
    if (!videoType) return;

    const VideoModel = videoType.model;
    const VideoView = videoType.view;

    domc.addType('video', {
      model: VideoModel.extend(
        {
          init() {
            this.listenTo(this, 'change:sourceType', this.updateTraitVisibility);
            this.listenTo(this, 'change:localFile', this.handleLocalFile);
          },

          handleLocalFile() {
            const file = this.get('localFile');
            if (file instanceof File) {
              const blobUrl = URL.createObjectURL(file);
              this.set('src', blobUrl);
              this.trigger('change:src');
            }
          },

          updateTraitVisibility() {
            const traits = this.get('traits') || [];
            const type = this.get('sourceType');

            traits.forEach((trait) => {
              const name = trait.get('name');
              if (name === 'localFile') {
                trait.set('visible', type === 'local');
              } else if (name === 'src') {
                trait.set('visible', type !== 'local');
              }
            });
          },
        },
        {
          defaults() {
            return {
              ...VideoModel.prototype.defaults(),
              sourceType: 'html5',
              traits: [
                {
                  type: 'select',
                  label: 'Source Type',
                  name: 'sourceType',
                  options: [
                    { value: 'html5', name: 'HTML5 Source' },
                    { value: 'youtube', name: 'Youtube' },
                    { value: 'yt-nocookie', name: 'Youtube (no cookie)' },
                    { value: 'vimeo', name: 'Vimeo' },
                    { value: 'local', name: 'Local File' }, // ✅ Our new type
                  ],
                  changeProp: 1,
                },
                {
                  type: 'text',
                  label: 'Source (URL)',
                  name: 'src',
                  placeholder: 'https://example.com/video.mp4',
                  changeProp: 1,
                },
                {
                  type: 'file',
                  label: 'Upload Local Video',
                  name: 'localFile',
                  accept: 'video/*',
                  changeProp: 1,
                  visible: false, // will be shown dynamically
                },
                'poster',
                'alt',
                'loop',
                'autoplay',
                'controls',
              ],
            };
          },
        }
      ),

      view: VideoView.extend({
        onRender() {
          this.model.updateTraitVisibility();
        },
      }),
    });

    // Optional: rename block
    const vb = bm.get('video');
    if (vb) {
      vb.set({ label: 'Video (Local Enabled)' });
    }
  }

  window.grapesjsPluginLocalVideo = grapesjsPluginLocalVideo;
})();
