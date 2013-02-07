// this is in the process of being rewritten and optimized
/**
 * Copyright (c) 2011 Nick Kwiatek <http://nkwiatek.com>
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
 
 
 (function(window) {
 
	var FluidDisplayASCII = function(fluid) {
		
		var _Config = {
		
			// strength of forces
			density: 260
			
			// ascii gradient
			//gradient: [' ', 'Â·','.','â€¢','Â¤','x','X','N','M'],
			//gradient: [' ', 'Â·','.','Â¤','x','X','N','M','Â¶'],
			//gradient: [' ', 'Â·','~','Â¢','Â»','Â¤','X','Â¥','Â¶'],
			, gradient: [' ', '·','^','¤','`','*','`','»','Â','~']
			
			// animation update timing in milliseconds
			, tickrate: 15
			, blastDensity: 9000
			, blastVelocity: 6000
		
		};
		this.Config = _Config;
		
		// creates/retrieves stored object which allows us to manipulate the ASCII text block being displayed
		var getDisplay = (function() { 
			
			// cache of ascii gradient data
			var _gradient = _Config.gradient;
			var _gradient_len = _Config.gradient.length - 1;
			
			// container for holding the display text 
			var _ascii = [];
			
			// the artifical dimensions of the field
			var _width = null;
			var _height = null;
			var _length = null;
			
			// object returned by func, for manipulating display text
			var _Display = {
				length: function() {
					return _length;
				},
				// TODO: figure out how this should work in conjunction with field.reset()
				reset: function() {
					resizeDisplay(dimensions.width, dimensions.height, true);
				},
				set: function(field) {
					var rowSize = field.rowSize();
					var dens = field.rawDensityArray;
					
					var y = _height - 1; do {
						// small optimisations here
						var yAsciiOffset = y * _width; 
						var yDensityOffset = (y + 1) * rowSize;
						
						var x = _width; do {
							// we use x - 1 because our array is index 1, theirs is index 0
							var value = dens[x + yDensityOffset] + 0.5 | 0; // bitwise round
							
							if (value > _gradient_len) {
								value = _gradient_len;
							}
							
							_ascii[x + yAsciiOffset] = _gradient[value];
						} while(x-- > 1);
					} while(y--);
				},
				toString: function() {
					// much faster implementation, by like 1000%, even on engines natively supporting Array.reduce()
					// slices array by row length, appends newline
					var retval = '';
					for (var i = 1; i <= _height; i++) {
						var range = i * _width + 1; // + 1 because the slice end is not inclusive (but we need it to be)
						retval += _ascii.slice(range - _width, range).join('') + '\n';
					}
					return retval;
				}
			};
			
			
			// private function for resizing private ascii container
			var _resizeDisplay = function (width, height, overwrite) {
				// is this how you do default values?
				if (overwrite === undefined) {
					overwrite = false;
				}
				
				_width 	= width;
				_height = height;
				_length = width * height;
				
				for (var i = 1; i <= _length; i++) {
					if (overwrite || _ascii[i] === undefined) {
						_ascii[i] = _Config.gradient[1];
					}
				}
			};
			
			// Display factory (returns cache if valid)
			return function(width, height) {
				// if for some reason this is unoptimal, 
				// we can use an event listener callback on fluid resize, 
				// instead of requiring width/height on get()
				if (width !== _Display.width && height !== _Display.height) {
					_resizeDisplay(width, height);			
				}
			
				return _Display;
			};
			
		})();
		
		
		//
		// TODO: addForce, generalize the mouse calculation operation into a func
		// onclick: force
		// take setUI on force obj out of display renderer


		// store the bound DOM element inside this object's scope
		this.bindElement = function(DOMElement) {
		
			// used on field.update to determine whether we should apply velocity 
			var checkMouseMovement = false;
			var checkMouseClick = false;
			
			// mouse coordinates relative to element's origin
			var mouse_cur = {x: null, y: null};
			var mouse_prev = null;	
			var origin = (function(el) {
				var x = 0, y = 0;
				do {
					x += el.offsetLeft;
					y += el.offsetTop;
				} while (el = el.offsetParent);
				return { x: x, y: y };
			})(DOMElement);

			
			DOMElement.unselectable = true;
			
			DOMElement.onmousedown = (function() {
				checkMouseClick = true;
			})

			DOMElement.onmousemove = (function() {
				var doc_body = window.document.body;
				var doc_element = window.document.documentElement;
				
				return function(e) {
					// the following browser-wide mouse coordinates logic taken mostly from quirksmode
					// http://www.quirksmode.org/js/events_properties.html#position
					if (!e) {
						e = window.event;
					}
					if (e.pageX || e.pageY) {
						mouse_cur.x = e.pageX;
						mouse_cur.y = e.pageY;
					}
					else if (e.clientX || e.clientY) {
						mouse_cur.x = e.clientX + doc_body.scrollLeft + doc_element.scrollLeft;
						mouse_cur.y = e.clientY + doc_body.scrollTop + doc_element.scrollTop;
					}
					
					// has to be initialized somewhere; better here than in the UI callback
					// could probably do a crazy trick involving a named var for 'onmousemove =',
					// having it first be a check for mouse_prev, then replacing the named func
					// with a func that doesn't have the check, if this line of code is REALLY an issue
					// probably not a factor here, but an interesting idea for somewhere more critical
					if (mouse_prev === null) {
						mouse_prev = {x: mouse_cur.x, y: mouse_cur.y};
					}
					checkMouseMovement = true;
				}
			})();
			
			// called on fluid's update() method (before physics calculations)
			// we can make changes to the field here
			fluid.setUICallback(function(field) {

				// click explosion
				if (checkMouseClick) {
					var x_fluid
						, y_fluid
						, deWidth = DOMElement.offsetWidth
						, deHeight = DOMElement.offsetHeight
						, fWidth = field.width()
						, fHeight = field.height()

					// map element coords to fluid coords
					x_fluid = (mouse_cur.x * (fWidth / deWidth)) + 0.5 | 0 // bitwise round
					y_fluid = (mouse_cur.y * (fHeight / deHeight)) + 0.5 | 0 // bitwise round
					
					
					
					// apply the shockwave by setting params in the 8 pixels around the current position
					// (as well as some extra dead weight in the current position)
					for (var w = -1; w <= 1; w++) {
						for (var h = -1; h <= 1; h++) {
							field.setDensity(x_fluid + w, y_fluid + h, _Config.blastDensity)
							field.setVelocity(x_fluid + w, y_fluid + h, _Config.blastVelocity * w, _Config.blastVelocity * h)
						}
					}

					checkMouseClick = false
				}



				// add velocity if the mouse has moved within the body of the display
				if (checkMouseMovement /*&& mouse_prev != null*/) {
								
					var diff_x = mouse_cur.x - mouse_prev.x;
					var diff_y = mouse_cur.y - mouse_prev.y;
					
					var distance = Math.sqrt(diff_x * diff_x + diff_y * diff_y) + 0.5 | 0; // bitwise round
					distance = distance < 1 ? 1 : distance;
					
					
					// small optimization
					var fSetVelocity = field.setVelocity;
					var fSetDensity = field.setDensity;
					var fWidth = field.width();
					var fHeight = field.height();
					var deWidth = DOMElement.offsetWidth;
					var deHeight = DOMElement.offsetHeight;
					var mp_x = mouse_prev.x;
					var mp_y = mouse_prev.y;
					
					// interpolate steps between the current position and the previous capture
					var i = distance - 1; do {
						var x = (((mp_x + diff_x * (i / distance)) / deWidth) * fWidth) + 0.5 | 0; // bitwise round
						var y = (((mp_y + diff_y * (i / distance)) / deHeight) * fHeight) + 0.5 | 0; // bitwise round
						fSetVelocity(x, y, diff_x, diff_y);
						fSetDensity(x, y, _Config.density);
					} while(i--);
					
					// update record of calculation
					mouse_prev.x = mouse_cur.x;
					mouse_prev.y = mouse_cur.y; 
					checkMouseMovement = false;
				}
			});
			
			
			// called at the end of every frame, after calculations are complete
			// draw changes here
			fluid.setDisplayFunction(function(field) {	
				// update display with data from field
				var display = getDisplay(field.width(), field.height());
				display.set(field);
				
				
				// update the DOM DOMElement with the display text
				/*while(DOMElement.childNodes.length >= 1) {
					DOMElement.removeChild(DOMElement.firstChild);
				}
				DOMElement.appendChild(DOMElement.ownerDocument.createTextNode( display.toString() ));*/
				DOMElement.innerHTML = display.toString();
			});
		};
		
		// public interface for starting/stopping animation
		this.Animation = {
			interval: null,
			start: function(fnOnFrameUpdate) {
				if (this.interval !== null) {
					return;
				}		
				
				// this IIFE will return either: 
				// - a function that calls the callback
				// - a function that just does the tick
				// depending on whether fnOnFrameUpdate was passed
				// todo: replace `fluid` with `callback` passed with `Function.bind(fluid, fluid.update)`
				
				;(function(interval, tickrate, fluid, fnOnFrameUpdate) {
					var fn = (fnOnFrameUpdate instanceof Function) ?
						function tickWithCallback() {
							fluid.update();
							fnOnFrameUpdate();
							interval = setTimeout(tickWithCallback, tickrate);
						} 
						: function tickNoCallback() {
							fluid.update();						
							interval = setTimeout(tickNoCallback, tickrate);
						}
					
					// start the clock
					fn();
					
				// redundant vars passed here to whittle down the closure nesting 
				// (for performance -- this shit gets called every frame)
				}(this.interval, _Config.tickrate, fluid, fnOnFrameUpdate)) 
			},
			/*start: function(cbOnFrameUpdate) {
				if (this.interval === null) {
					var _proc = ((function(interval, tickrate) {
						return function tick() {
							fluid.update();						
							if (cbOnFrameUpdate instanceof Function) {
								cbOnFrameUpdate();
							}
							interval = setTimeout(procClosureHandle, tickrate);
						};
					})(this.interval, _Config.tickrate)); 
					procClosureHandle = _proc;
					procClosureHandle();
				}
			},*/
			stop: function() {
				if (this.interval !== null) {
					clearInterval(this.interval);
					this.interval = null;
				}
			}
		};
		
	};

	window['FluidDisplayASCII'] = FluidDisplayASCII;
})(window);
