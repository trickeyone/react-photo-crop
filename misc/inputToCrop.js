(function($){
	$.fn.inputToCrop = function(options){
		var settings = $.extend({
			// These are the defaults.
				cropHere: '#cropHere',
				cropSize: [{w: 72, h: 52}, {w: 150, h: 150}, {w: 36, h: 36}, {w: 29, h: 29}, {w: 300, h: 300}], //First element will be default for aspectRatio
				preview: ['.p72x52', '.p150x150', '.p36x36', '.p29x29'], //Optional, Error on Firefox when open large dimension image
				boxHeight: 300,
				boxWidth: 300,
				maxResolution: 4000,
				wrapContainer: '.wrap-container',
				uploadContainer: '.upload-container',
				cropContainer: '.crop-container',
				previewContainer: '.preview-container',
				errorHere: '.upload-error',
				showControl: true,
				rotateLeft: '.rotate-left',
				rotateRight: '.rotate-right',
				resize: 450// set 0 if you don't want resize
			}, options );
		return this.each(function() {
			var self = this;

			self.initVariable = function() {
				self.file = this.files[0];
				
				self.wrapContainer = settings.wrapContainer;
				self.uploadContainer = settings.uploadContainer;
				self.cropContainer = settings.cropContainer;
				self.previewContainer = settings.previewContainer;
				self.cropHere = settings.cropHere;
				self.errorHere = settings.errorHere;
				
				self.showControl = settings.showControl;
				self.rotateLeft = settings.rotateLeft;
				self.rotateRight = settings.rotateRight;
				
				var $wrap = $(self).closest(self.wrapContainer);
				self.$container = {
					wrap: $wrap,
					upload: $(self.uploadContainer, $wrap),
					crop: $(self.cropContainer, $wrap),
					preview: $(self.previewContainer, $wrap),
					cropHere: $(self.cropHere, $wrap),
					errorHere: $(self.errorHere, $wrap),
				};
				
				self.preview = settings.preview;
				self.cropSize = settings.cropSize;
				
				self.resize = settings.resize;
				self.maxResolution = settings.maxResolution;
				//Info of image source
				self.imageInfo = {};
				
				self.imageData = [];
				self.imagePreview = [];
				self.hasError = false;
				self.errorMessage = '';

				self.boxHeight = settings.boxHeight;
				self.boxWidth = settings.boxWidth;
			};
			
			self.destroy = function() {
				self.emptyImage();
				$(self).data('inputCrop', null);
			};
			
			self.getImageInfo = function() {
				return self.imageInfo;
			};
			
			self.setImageInfo = function(data) {
				$.extend(self.imageInfo, data);
			};
			
			self.initFile = function() {
				if (self.file.type.match(/image.*/)) {
					self.imageInfo = {
						src: URL.createObjectURL(self.file),
						type: self.file.type
					};
					self.hasError = false;
				} else {
					self.hasError = true;
					self.errorMessage = "Not support this extension";
				}
			};
			
			self.resizeImage = function(successCallback) {
				var tmpClass = 'tmp-image',
					data = {
						src: self.imageInfo.src,
						'class': tmpClass
					},
					$image_raw = self.$image(data);
				
				$('.tmp-image-container', self.$container.wrap).html($image_raw);
				
				$image_raw.load(function(){
					var w = $(this).width(),
						h = $(this).height(),
						ratio = w/h,
						size = {width: self.resize, height: self.resize/ratio};
					
					if (w > self.maxResolution || h > self.maxResolution) {
						self.hasError = true;
						self.errorMessage = 'Not support resolution greater than ' + self.maxResolution +'px';
						self.showError(self.errorMessage);
						self.$container.upload.show();
						self.$container.crop.hide();
						self.removeImagePreview();
						self.destroy();
						return;
					}
					if (w < h) {
						size = {width: self.resize*ratio, height: self.resize};
					}
					if (self.resize > 0) {
						Pixastic.process($('.' + tmpClass)[0], "resize", size, function(canvas) {
							self.imageInfo.src = canvas.toDataURL();
						});
					}
					if ($.isFunction(successCallback)) {
						successCallback();
					}
					// Caman('.' + tmpClass, function () {
						// if (self.resize > 0) {
							// if (w > h) {
								// if (w > self.resize) {
									// this.resize({width: self.resize});
								// }
							// } else {
								// if (h > self.resize) {
									// this.resize({height: self.resize});
								// }
							// }
						// }
						// this.render(function(){
							// self.imageInfo.src = this.canvas.toDataURL();
							// if ($.isFunction(successCallback)) {
								// successCallback();
							// }
						// });
					// });
				});
			};
			
			self.initImage = function() {
				var data = {
						src: self.imageInfo.src,
						style: 'display: none'
					},
					$image_raw = self.$image(data);
					
				self.$container.cropHere.html($image_raw);
				
				$image_raw.load(function(){
					self.setImagePreview(data);
					self.initCrop(this, self.cropSize[0], self.preview[0]);
				});
			};
			
			self.initCrop = function(image, cropSize, preview) {
				// Create variables (in this scope) to hold the API and image size
				 var jcrop_api,
					 bounds,
					 $preview = $(preview); 
					 xsize = cropSize.w,
					 ysize = cropSize.h;
				
				$(image).Jcrop({
					onChange: updatePreview,
					onSelect: updatePreview,
					aspectRatio: xsize / ysize,
					boxHeight: self.boxHeight,
					boxWidth: self.boxWidth
				},function(){
				   // Use the API to get the real image size
					self.$container.cropHere.css({
						'width': $('.jcrop-holder').width(),
						'height': $('.jcrop-holder').height()
					});
					
					bounds = this.getBounds();

					jcrop_api = this; // Store the API in the jcrop_api variable

					jcrop_api.setSelect(self.centerCropPosition(bounds, xsize, ysize));
					
				});
				function updatePreview(c) {
					if (parseInt(c.w) > 0) {
						var len = self.cropSize.length;
						self.imageData = [];
						for (var i = 0; i < len; i++) {
							var imageData = {
									image: image,
									crop: c,
									size: self.cropSize[i],
									type: self.imageType
								};
							if (i == 0) {
								self.updateCropPreview($(self.imagePreview[i]), self.cropSize[i], bounds, c);
							} else {
								var c2 = {
										w: c.h,
										h: c.h,
										x: c.x + (c.w - c.h)/2,
										y: c.y,
										y1: c.y1,
										x1: c.x1
									};
								self.updateCropPreview($(self.imagePreview[i]), self.cropSize[i], bounds, c2);
								imageData.crop = c2;
							}
							self.imageData.push(imageData);
						}
					}
				}
			};
			
			self.initControl = function() {
				var tmpClass = 'tmp-image';
				$('.control-container').css('position', 'static');
				
				$([$(self.rotateLeft), $(self.rotateRight)]).each(function(){
					$(this).unbind().click(function(e){
						e.preventDefault();
						var degree = 90;
						if ($(this).hasClass(self.rotateLeft.substring(1))) {
							degree = -90;
						}
						Caman('.' + tmpClass, function () {
							this.rotate(degree);
							//this.resize({width: 400});
							this.render(function(){
								var data = {src: this.canvas.toDataURL()};
								self.setImageInfo(data);
								self.initImage();
							});
						});
					});
				});
			};
			
			self.getImageData = function() {
				return self.imageData;
			};
			
			self.drawCanvas = function(imageData, canvas) {
				var ctx = canvas.getContext("2d");
				ctx.drawImage(imageData.image, imageData.crop.x, imageData.crop.y, imageData.crop.w, imageData.crop.h, 0, 0, canvas.width, canvas.height);
			};

			self.$image = function(data) {
				var $img = $('<img />');
				$.each(data, function(key, value){
					$img.attr(key, value);
				});
				return $img;
			};
			
			self.cropToImage = function(imageData, size) {
				if (!size) {
					size = imageData.size;
				}
				var canvas = document.createElement('canvas');
				canvas.width = size.w;
				canvas.height = size.h;
				self.drawCanvas(imageData, canvas);
				return canvas.toDataURL();
			};
			
			self.updateCropPreview = function(imgPreviewSelector, cropSize, bounds, c) {
				var rx = cropSize.w/c.w,
					ry = cropSize.h/c.h,
					boundx = bounds[0],
					boundy = bounds[1];
					
				$(imgPreviewSelector).css({
					width: Math.round(rx * boundx) + 'px',
					height: Math.round(ry * boundy) + 'px',
					marginLeft: '-' + Math.round(rx * c.x) + 'px',
					marginTop: '-' + Math.round(ry * c.y) + 'px'
				}).show();
			};
			
			self.setImagePreview = function(imageData) {
				self.imagePreview = [];
				var len = self.preview.length;
				for (var i = 0; i < len; i++) {
					var $image_raw = self.$image(imageData);
					$(self.preview[i]).html($image_raw);
					self.imagePreview.push($image_raw[0]);
				}
			};
			
			self.removeImagePreview = function() {
				var len = self.preview.length;
				for (var i = 0; i < len; i++) {
					$(self.preview[i]).html('');
				}
			};

			self.init = function() {
				self.initVariable();
				self.hideError();
				self.initFile();
				if (self.hasError) {
					self.showError(self.errorMessage);
					//console.log("Not support this extension");
					return;
				}
				
				self.$container.upload.hide();
				self.$container.crop.show();
				
				self.resizeImage(self.initImage);
				
				if (self.showControl) {
					self.initControl();
				}

				$(self).data('inputCrop', self);
			};
			
			self.emptyImage = function() {
				self.$container.cropHere.html('');
			};
			
			self.showError = function(error) {
				self.$container.errorHere
					.find('p')
					.html(error);
				self.$container.errorHere.show();
			};
			
			self.hideError = function() {
				self.$container.errorHere
					.hide()
					.find('p')
					.html('');
			};
			
			self.centerCropPosition = function(bounds, w, h){
				var W = bounds[0],
					H = bounds[1],
					x, y, x1, y1, pos = [];
				if (w != h) {
					if (W > H) {
						x1 = H*w/h;
						x = (W - x1)/2;
						y = 0;
						pos = [x, y, x1, H];
					} else {
						y1 = W*h/w;
						x = 0;
						y = (H - y1)/2;
						pos = [x, y, W, y1];
					}
				} else {
					if (W > H) {
						x = (W - H)/2;
						y = 0;
					} else {
						x = 0;
						y = (H - W)/2;
					}
					pos = [x, y, W, H];
				}
				
//					x = (W - w)/2,
//					y = (H - h)/2,
//					x1 = x + w,
//					y1 = y + h,
//					pos = [x, y, x1, y1];
    			return pos;
			};
			
			self.init();
		});
	};
}( jQuery ));