jQuery(document).ready(function() {
	
	egw = {
		selectImage: function(id) {
			
			// Switch to our custom media library.
			wp.media.view.MediaFrame.Select = egw.egwMediaLibrary;
			
			var mediaFrame = wp.media({
				title : 'EGW Hover Effects ',
				multiple : false,
				type: 'post',
				library : { type : 'image' },
				button : { text : objectL10n.insertIntoWidget }
			});

			// Media library closed.
			mediaFrame.on('close', function() {
				// Restore original media library.
				wp.media.view.MediaFrame.Select = egw.originalMediaLibrary;
  			});
			
			// Image was selected from Media Library.
			mediaFrame.on('insert', function() {
				var image = mediaFrame.state().get('selection').toJSON();
				egw.imageSelected(
						id,
						image[0],
						jQuery('select.size', mediaFrame.el).val()
					);
			});
			
			// Image was selected by URL.
			mediaFrame.on('select', function() {
				egw.imageEmbeded(
						id,
						jQuery('label.embed-url input', mediaFrame.el).val(),
						jQuery('label.setting.alt-text input', mediaFrame.el).val()
					);
			});
			
			mediaFrame.open();
		},
		removeImage: function(id) {
			jQuery(id + ' .remove-image').hide();
			jQuery(id + ' .img-thumb').html('');
			jQuery(id + ' .src').attr('value', '');
			jQuery(id + ' .select-image').show();
		},
				
		imageSelected: function(id, image, selectedSize) {
			objSize = image.sizes[selectedSize];
			jQuery(id + ' .remove-image').show();
			jQuery(id + ' .img-thumb').html('<img src="' + objSize.url + '" style="max-width: 100%;">');
			jQuery(id + ' .src').attr('value', objSize.url);
			jQuery(id + ' .alt').attr('value', image.alt);
			jQuery(id + ' .select-image').hide();
		},
		init: function() {
		
			// Keep a copy of original image library.
			try {
				this.originalMediaLibrary = wp.media.view.MediaFrame.Select;
				this.egwMediaLibrary = this.createMediaLibrary();
				
				
			} catch(e) {
				console.log('Unable to load Media Library');
			}
			
		},
		
		createMediaLibrary: function() {
			return wp.media.view.MediaFrame.Select.extend({
				initialize: function() {
					wp.media.view.MediaFrame.prototype.initialize.apply(this, arguments);

					_.defaults(this.options, {
						multiple: true,
						editing: false,
						state: 'insert'
					});

					this.createStates();
					this.bindHandlers();
					
					
				},
				createStates: function() {
					var options = this.options;

					// Add the default states.
					this.states.add([
						// Main states.
						new wp.media.controller.Library({
							id: 'insert',
							title: objectL10n.insertMedia,
							priority: 20,
							toolbar: 'main-insert',
							filterable: 'image',
							library: wp.media.query(options.library),
							multiple: options.multiple ? 'reset' : false,
							editable: true,
							// If the user isn't allowed to edit fields,
							// can they still edit it locally?
							allowLocalEdits: true,
							// Show the attachment display settings.
							displaySettings: true,
							// Update user settings when users adjust the
							// attachment display settings.
							displayUserSettings: true
						}),
						// Embed states.
						new wp.media.controller.Embed(),
					]);


					if (wp.media.view.settings.post.featuredImageId) {
						this.states.add(new wp.media.controller.FeaturedImage());
					}
				},
				bindHandlers: function() {
					// from Select
					this.on('router:create:browse', this.createRouter, this);
					this.on('router:render:browse', this.browseRouter, this);
					this.on('content:create:browse', this.browseContent, this);
					this.on('content:render:upload', this.uploadContent, this);
					this.on('toolbar:create:select', this.createSelectToolbar, this);
					//

					this.on('menu:create:gallery', this.createMenu, this);
					this.on('toolbar:create:main-insert', this.createToolbar, this);
					this.on('toolbar:create:main-gallery', this.createToolbar, this);
					this.on('toolbar:create:featured-image', this.featuredImageToolbar, this);
					this.on('toolbar:create:main-embed', this.mainEmbedToolbar, this);

					var handlers = {
						toolbar: {
							'main-insert': 'mainInsertToolbar'
						}
					};

					_.each(handlers, function(regionHandlers, region) {
						_.each(regionHandlers, function(callback, handler) {
							this.on(region + ':render:' + handler, this[ callback ], this);
						}, this);
					}, this);
				},
			
				
				// Toolbars
				selectionStatusToolbar: function(view) {
					var editable = this.state().get('editable');

					view.set('selection', new wp.media.view.Selection({
						controller: this,
						collection: this.state().get('selection'),
						priority: -40,
						// If the selection is editable, pass the callback to
						// switch the content mode.
						editable: editable && function() {
							this.controller.content.mode('edit-selection');
						}
					}).render());
				},
				mainInsertToolbar: function(view) {
					var controller = this;

					this.selectionStatusToolbar(view);

					view.set('insert', {
						style: 'primary',
						priority: 80,
						text: objectL10n.selectImage,
						requires: {selection: true},
						click: function() {
							var state = controller.state(),
									selection = state.get('selection');

							controller.close();
							state.trigger('insert', selection).reset();
						}
					});
				}

			});
		}
	};
	egw.init();
	
});