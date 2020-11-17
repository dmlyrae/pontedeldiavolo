export function Init() {
	this.board = document.querySelector('#board');
	this.width = this.board.offsetWidth;
	this.board.style.height = this.width;

	this.colors = {
		white: '#ea6951',
		black: '#543a3b',
		neutral: '#d9d4d7',
		border_color: '#b48378',
		border_color_over: '#000000',
		reserve: '#c8aca7',
		select: '#008844',
	}
	this.size = 10;
	this.turn = 0;
	this.cell_size = Math.floor((this.width - 30) / this.size);
	this.history = [];
	this.selected_cells = [[-1, -1], [-1, -1]];
	this.bridges = [];
	this.draw_field = SVG().addTo('#board ').size(this.width - 30, this.width);
	this.allow_moves = [];


	this.btn_new = document.querySelector('#btnnew');
	this.btn_block = document.querySelector('.btn_block');
	if (window.screen.width > 760) this.btn_block.style = 'padding-top: ' + this.cell_size + ';';
	
	this.move_pointer = document.querySelector('#move_pointer');
	this.move_pointer.classList.add('move_pointer','white');

	this.moves_block = document.querySelector('#moves_block');
	this.base_move = document.querySelector('.move');
	this.black_p = document.querySelector('#black_p');
	this.white_p = document.querySelector('#white_p');

	this.back = document.querySelector('#back');
	this.forward = document.querySelector('#forward');
	this.move_control = document.querySelector('#move_control');

	this.save = document.querySelector('#save');
	this.load = document.querySelector('#load');
	this.game_list = document.querySelector('#game_list');
	this.list = this.game_list.querySelector('.modal-dialog-1');

	this.close_modal = document.querySelectorAll('.close_modal');
	this.save_dialog = document.querySelector('#save_dialog');

	this.save_form = document.querySelector('#save_form');
	this.game_name = save_form.querySelector('input');
	this.saveas = save_form.querySelector('button');

	this.load_archive = () => {
		if (localStorage.getItem('archive') != null) {
			this.archive = JSON.parse(localStorage.getItem('archive'));
		} else {
			this.archive = {};
			localStorage.setItem('archive', JSON.stringify(this.archive));
		}
		let l = this.list.querySelectorAll('div');
		l.forEach ((item) => {item.remove();})
		for (var key in this.archive) {
			let div_in_list = document.createElement('div');
			div_in_list.classList.add('row', 'div_in_list');
			div_in_list.style = `width: ${this.width};` 
			div_in_list.id = key;
			div_in_list.innerHTML = `
				<div class = "col date">${this.archive[key].date}</div>
				<div class = "col name_game" >${key}</div>
				<div class = "col-2 remove_icon">del</div>
			`
			this.list.appendChild(div_in_list);
			div_in_list.addEventListener('click', (event) => {
				let id = event.target.parentElement.id;
				console.log(id);
				if (event.target.classList.contains('remove_icon')) {
					delete this.archive[id];
					div_in_list.remove();
					let a = JSON.stringify(this.archive);
					localStorage.setItem('archive', a);
				} else {
					this.history = this.archive[id].history.slice();
					this.turn = this.history.length;
					let moves = this.moves_block.querySelectorAll('move');
					for (i = 0; i < moves.length - 1; i++) {
						moves[i].remove();
					}
					this.history.forEach((item) => {
						let b_id = item.button_id;
						let b_HTML = item.button_innerHTML;
						item.button = this.base_move.cloneNode(false);
						item.button.id = b_id;
						item.button.innerHTML = b_HTML;
						item.button.addEventListener('click', this.load_position);
						this.moves_block.insertBefore(item.button, this.base_move);
					});
					this.load_position(this.turn - 1);
				}
				this.game_list.classList.toggle('is_open');
			})
		}
	}

	this.load_archive();
	

	let coor_top = document.querySelector('.coor_top');
	coor_top.style = 'height: ' + this.cell_size;
	let coor_right = document.querySelector('.coor_left_right');
	for (var i = 0; i < this.size; i++) {
		let coor_cell = document.createElement('div');
		let coor_cell2 = document.createElement('div');
		coor_cell.classList.add('coor_cell');
		coor_cell2.classList.add('coor_cell');
		coor_cell.innerHTML = '<b><span>' + 'abcdefghijklm'[i] + '</span></b>';
		coor_cell2.innerHTML = '<b><span>' + (1 + i) + '</span></b>';
		coor_top.appendChild(coor_cell);
		coor_right.appendChild(coor_cell2);
		coor_cell.style = 'max-width: ' + this.cell_size+'; padding-top: ' + Math.floor(this.cell_size/2) 
		coor_cell2.style = 'max-height: ' + this.cell_size + ';' + 'padding-top: ' + Math.floor(this.cell_size/2) 
			+ ';';
	}


	var Cell = function(x, y, colors, size, draw_field, coor) {
		this.value = 0;
		this.bridge = [];
		this.x = x;
		this.y = y;
		this.se = false;
		this.size = size;
		this.allow = true;
		this.rect_config = {
						'x': this.x + 1,
						'y': this.y + 1,
						'rx': Math.floor(size/10),
						'ry': Math.floor(size/10),
						'height': this.size - 2,
						'width': this.size - 2,
						'stroke': colors.border_color,
						'stroke-width': 2,
						'coor': coor,
						'title': coor,
		}
		this.rect_config_neutral = {
			'stroke': colors.border_color,
			'fill': colors.neutral,
		}
		this.rect_config_white = {
			'fill': colors.white,
		}
		this.rect_config_black = {
			'fill': colors.black,	
		}
		this.rect_config_over = {
			'stroke': '#000000',	
		}
		this.rect_config_out = {
			'stroke': colors.border_color,	
		}
		this.rect_config_select = {
			'stroke': colors.select,	
		}
		this.rect = draw_field.rect();
		this.reset = ()  => {
			this.rect.attr(this.rect_config);
			switch (this.value) {
				case 1: this.rect.attr(this.rect_config_white);
					break;
				case 2: 
					this.rect.attr(this.rect_config_black);
					break;
				default: this.rect.attr(this.rect_config_neutral);
					break;
			}
			this.se = false;
			//this.bridge = [];
		}
		this.over = () => {
			if (this.se) {return;}
			this.rect.attr(this.rect_config_over);
		}
		this.out = () => {
			if (this.se) {return;}
			this.rect.attr(this.rect_config_out);
		}
		this.white = () => {
			this.rect.attr(this.rect_config_white);
			//if (!this.se) {this.value = 1};
		}
		this.black = () => {
			this.rect.attr(this.rect_config_black);
			//if (!this.se) {this.value = 2};
		}
		this.select = () => {
			this.se = !this.se;
			this.out();
			if (this.se) {this.rect.size(this.size - 8);this.rect.size(this.size - 8).move(this.x + 3, this.y + 3);}
			else {this.rect.size(this.size - 2).move(this.x + 1, this.y + 1);}
		}
		this.rect.on("mouseenter", this.over);
		this.rect.on("mouseout", this.out);
	}

	this.draw = () => {
		this.base_move.innerHTML = (this.turn + 1) + ". _____";
		this.field = [];
		this.history = [];
		this.selected_cells = [[-1, -1], [-1, -1]];
		this.bridges.forEach((item) => {
			//console.log(item);
			item.line.remove();
		});
		this.bridges = [];
		this.turn = 0;
		this.move_pointer.innerHTML = "1";
		for(var i = 0; i < this.size; i++) {
			this.field[i]  = [];
			for (var i2 = 0; i2 < this.size; i2++) {
				this.field[i][i2] = new Cell (i * this.cell_size , i2 * this.cell_size + 1, this.colors, this.cell_size - 2, this.draw_field, [i, i2]);
				this.field[i][i2].reset();
				this.field[i][i2].rect.on("click", this.select);
			}
		}
		for (var i = 0; i < this.size; i++) {
			this.allow_moves[i] = [];
			for (var i2 = 0; i2 < this.size; i2++) {
				this.allow_moves[i][i2] = [];
				for (var i3 = 0; i3 < this.size; i3++) {
					this.allow_moves[i][i2][i3] = [];
					for (var i0 = 0; i0 < this.size; i0++) {
						this.allow_moves[i][i2][i3][i0] = true;
					}
				}		
			}		
		}
	}
	
	this.refresh_allow = () => {
		this.field.forEach((xr) => {xr.forEach((cell) => {
			let white = this.turn % 2 == 0;
			cell.allow = (cell.value != 2 && white) || (cell.value != 1 && !white);
			if (cell.value == 3) {cell.allow = false; cell.rect.hide();}
			if (cell.value == 4 && white) {cell.allow = false;} 
			if (cell.value == 5 && !white) {cell.allow = false;}
			if (cell.value == 6) {cell.allow = false; cell.rect.hide();}
		});});
	}

	this.select = (event) => {
		let white = this.turn % 2 == 0,
			coor = event.target.attributes.coor.value.split(' ');
		let x0 = Number.parseInt(this.selected_cells[0][0]),
			y0 = Number.parseInt(this.selected_cells[0][1]),
			x1 = Number.parseInt(coor[0]),
			y1 = Number.parseInt(coor[1]);
		if (!this.field[coor[0]][coor[1]].allow) {
				//console.log('restict from allow in CELL');
				this.field[x1][y1].reset();
				this.selected_cells = [[-1, -1], [-1, -1]];
				if (x0 > -1) {this.field[x0][y0].reset();}
				return;
		}

		this.field[x1][y1].select();
		if (white) {this.field[x1][y1].white();} else {this.field[x1][y1].black();}

		if (this.selected_cells[0][0] < 0) {
			this.selected_cells[0] = coor;
		} else {
			this.selected_cells[1] = coor;
			if (this.selected_cells[1][0] == this.selected_cells[0][0] && this.selected_cells[1][1] == this.selected_cells[0][1] ) {
				this.field[x1][y1].reset();
				this.selected_cells = [[-1, -1], [-1, -1]];
			} else {
				if (this.allow_moves[x0][y0][x1][y1]) {
					this.make_move();
				} else {
					this.field[x1][y1].reset();
					this.field[x0][y0].reset();
					this.selected_cells = [[-1, -1], [-1, -1]];					
				}		
			}
		}
	}

	this.make_bridge = (c0, c1) => {
		let x0 =  Number.parseInt(this.selected_cells[0][0]),
			y0 =  Number.parseInt(this.selected_cells[0][1]),
			x1 =  Number.parseInt(this.selected_cells[1][0]),
			y1 =  Number.parseInt(this.selected_cells[1][1]);
		c0.bridge = [x1, y1];
		c1.bridge = [x0, y0];
		let br =  {
			c0: c0,
			c1: c1,
			line: this.draw_field.line(c0.x + (this.cell_size/2), c0.y + (this.cell_size/2), c1.x + (this.cell_size/2), c1.y + (this.cell_size/2)),
		};
		let color = c0.value == 1 ? this.colors.white : this.colors.black;
		br.line.stroke({ color: color, width: 10, linecap: 'round' });
		this.bridges.push(br);
		let incr_x = Math.sign(x1 - x0),
			incr_y = Math.sign(y1 - y0);
		let dif1 = Math.abs(x0 - x1),
			dif2 = Math.abs(y0 - y1);
		this.field[x0 + incr_x][y0 + incr_y].value = 3;
		if (dif1 + dif2 == 3) {
			this.field[x0 + incr_x][y0 + incr_y].value = 3;
			if (dif2 == 2) {
				this.field[x0][y0 + incr_y].value = 3;
				this.field[x0][y0 + incr_y].rect.hide();
			} else {
				this.field[x0 + incr_x][y0].value = 3;
				this.field[x0 + incr_x][y0].rect.hide();
			}
		}
	}

	this.get_allow_moves = function (p, white) {

		if (typeof p != "object") {return [];}
		if (typeof p[0] != "object") {return [];}

		let turn = white ? 1 : 2;
		let alt_turn = turn - 1;
		let size = p.length;

		const l = size * size;

		let a_m = [],
			am = []; //allow moves
		for (var i = 0; i < size; i++) {
			a_m[i] = [];
			for (var i2 = 0; i2 < size; i2++) {
				a_m[i][i2] = [];
				for (var i3 = 0; i3 < size; i3++) {
					a_m[i][i2][i3] = [];
					for (var i0 = 0; i0 < size; i0++) {
						a_m[i][i2][i3][i0] = false;
					}					
				}				
			}			
		}

		for (var i0 = 0; i0 < l; i0++) {
			for (var i1 = i0 + 1; i1 < l; i1++) {
				let x0 = i0 % size,
					y0 = Math.floor(i0 / size),
					x1 = i1 % size,
					y1 = Math.floor(i1 / size);
				let p0 = p[x0][y0].value,
					p1 = p[x1][y1].value;

				// CELL OF THE WRONG COLOR
				if (((p0 == 1 || p1 == 1) && (turn == 2)) || ((p0 == 2 || p1 == 2) && (turn == 1))) {
					continue;
				}

				// DIFFERENT COLOR FILTER
				if ((p0 == 1 || p0 == 2 || p1 == 1 || p1 == 2) && p1 != p0 ) {
					continue;
				}
				if (p0 == 3 || p1 == 3) {
					continue;
				}
				/* ============================ ISLANDS
				==================================== */
				let t2 = white ? 4 : 5; 
				if (p0 == t2 || p1 == t2 || p0 == 6 || p1 == 6) { 
					continue;
				};

				let inc = [[0,-1],[1,0],[0,1],[-1,0]];
				let difx = Math.abs(x0 - x1),
					dify = Math.abs(y0 - y1);
				let isl = [[[x0, y0]], [[x1, y1]]];
				let fake_p = [];
				p.forEach((item, in1) => {
					fake_p.push([]);
					item.forEach((item2, in2) => {
						fake_p[in1][in2] = item2.value;
					}
				)});
				fake_p[x0][y0] = turn;
				fake_p[x1][y1] = turn;
				
				var find_dog = function (xx, yy, isxs) {
					let ci = [];
					isxs.forEach ((it) => {ci.push(it);})
					if (!check_len) {return ci;}
					let x = xx;
					let y = yy;
					let check = ci.reduce ((prev, i) => {return prev || (i[0] == x && i[1] == y)}, false);
					if (check) {return ci;}
					ci.push([x, y]);
					if (ci.length > 4) {check_len = false; return ci;}
					let inc_c = inc.filter(i => x + i[0] > -1 && x + i[0] < 10 && y + i[1] > -1 && y + i[1] < 10);
					inc_c.forEach ((i) => {
						if (fake_p[x + i[0]][y + i[1]] == turn || (x + i[0] == x0 && y + i[1] == y0) || (x + i[0] == x1 && y + i[1] == y1)) {
							ci = find_dog (x + i[0], y + i[1], ci);
						} else {
							return ci;
						}
					});
					return ci;
				}
				var expand_dog = function (island) {
					let incd = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
					let merge_value = fake_p[island[0][0]][island[0][1]];
					let pizdec_blya = true;
					island.forEach ((point) => {
						let x9 = point[0], y9 = point[1];
						let inc_c = incd.filter(i => x9 + i[0] > -1 && x9 + i[0] < 10 && y9 + i[1] > -1 && y9 + i[1] < 10);
						inc_c.forEach ((i) => {
							let xn = x9 + i[0], yn = y9 + i[1];
							let chk = false;
							chk = island.reduce((prev, itm) => {return (prev || (itm[0] == xn && itm[1] == yn));}, false); 
							if (!chk) {
								//console.log(xn, yn,island, merge_value,fake_p[xn][yn]);
								if (fake_p[xn][yn] == merge_value) {
									pizdec_blya = false;
									return false;
								}
							}
						});
					});
					return pizdec_blya;
				}

				let check_len = true;
				let isl_new = [];
				isl.forEach( (item) => {
					let cii = [];
					if (check_len) {
						cii = find_dog(item[0][0], item[0][1], cii);
						isl_new.push(cii);}
				});
				if (!check_len) {
					continue;
				} else {
					if (isl_new.length == 2) {
						let same = false;
						if (isl_new[0].length == isl_new[1].length) {
							same = true;
							isl_new[0].forEach ((ppo) => {
								same = isl_new[1].reduce((prev, ppo2) => {
									return (ppo2[0] == ppo[0] && ppo2[1] == ppo[1]) || prev;
								}, false);
							});
						}
						if (same) {isl_new.pop();}
						isl_new.forEach ((isll) => {
							if (isll.length == 4) {
								let check_expand = expand_dog(isll);
								if (!check_expand) {
									check_len = false;
								}
							}
						});
					}
				}
				if (!check_len)	{
					continue;
				}
				let ch1 = p0 == 0 || (p0 == 5 || p0 == 4),
					ch2 = p1 == 0 || (p1 == 5 || p1 == 4);

				if (ch1 && ch2) {
					a_m[x0][y0][x1][y1] = true; // NEUTRAL CELLs
					a_m[x1][y1][x0][y0] = true;
					am.push([[x0, y0], [x1, y1]]);
					continue;
				}

				/* ============================ BRIDGES
				==================================== */

				if (p[x0][y0].bridge.length > 0 || p[x1][y1].bridge.length > 0 ) {
					continue;
				}
				let dif1 = Math.abs(x0 - x1),
					dif2 = Math.abs(y0 - y1);
				if ((dif1 == 1 && dif2 < 2) || (dif2 == 1 && dif1 < 2) || dif1 > 2 || dif2 > 2) {
					continue;
				}
	
				let incr_x = Math.sign(x1 - x0),
					incr_y = Math.sign(y1 - y0),
					bridge_array = [];
				bridge_array.push([x0 + incr_x, y0 + incr_y]);
				if (dif1 + dif2 == 3) {
					bridge_array.push([x0 + incr_x, y0 + incr_y]);
					if (dif2 == 2) {
						bridge_array.push([x0, y0 + incr_y]);
					} else {
						bridge_array.push([x0 + incr_x, y0]);
					}
				}
				let check = false;
				bridge_array.forEach((item) => {
					check = p[item[0]][item[1]].value != 3 || check;
				});

				bridge_array.forEach((item) => {
					check = !(p[item[0]][item[1]].value == 1 || p[item[0]][item[1]].value == 2) && check;
				});

				if (p[x0][y0].bridge.length > 0 || p[x1][y1].bridge.length > 0) {check = false;}

				if (dif1 + dif2 == 4 || dif1 + dif2 == 3) {
					let inc_array = [[0,-1],[1,0],[0,1],[-1,0]];
					let check_point = [[x0, y0], [x1, y1]];
					for (var nn = 0; nn < 2; nn++) {
						let point1 = check_point[nn],
							point2 = check_point[1 - nn];
						let inc_cut = inc_array.filter (i => point1[0] + i[0] < 10 && point1[0] + i[0] > -1 && point1[1] + i[1] > -1 && point1[1] + i[1] < 10);
						inc_cut.forEach((inc3) => {
							let ix = point1[0] + inc3[0],
								iy = point1[1] + inc3[1];	

							if (p[ix][iy].bridge.length > 0) {
								let neigb = p[ix][iy].bridge,
									difx = point2[0] - point1[0],
									dify = point2[1] - point1[1];
								let difxm = neigb[0] - ix,
									difym = neigb[1] - iy;
								if (difx == difxm && Math.sign(dify) == -Math.sign(difym)
									&& Math.sign(dify) == inc3[1]) {check = false;}
								if (dify == difym && Math.sign(difx) == -Math.sign(difxm) 
									&& Math.sign(difx) == inc3[0]) {check = false;}
								/*console.log('ix iy', ix, iy);
								console.log('x0 y0 ..', x0, y0, x1, y1);
								console.log('dif', difx, dify, difxm, difym); */
							}
						});
					}
				}
				if (check) {
					a_m[x0][y0][x1][y1] = true;
					a_m[x1][y1][x0][y0] = true;
					am.push([[x0, y0], [x1, y1]]);
					continue;
				}
				continue;
			}
		}
		return [a_m, am];
	}


	this.score = (ia, p, wh) => {
		let ma = wh ? ia.white : ia.black;
		let fa = [];
		let find_dog = function (search_array, current_array, current_number) {
			let sa = search_array;// current islands array
			let ca0 = current_array.slice(); // current chain of islands
			let cis = sa.splice(current_number, 1)[0]; // current island
			if (cis.length == 1) return ca0;
			ca0.push(cis);
			// searching bridges
			cis.forEach((item) => {
				if (p[item[0]][item[1]].bridge.length > 0) {
					let an = p[item[0]][item[1]].bridge;
					let chk = true, num = 0;
					while (num < sa.length) {
						chk = sa[num].reduce ((cur, itm) => {return cur || (itm[0] == an[0] && itm[1] == an[1]);}, false)
						if (chk) {
							ca0 = find_dog(sa, ca0, num);
						} else {
							num++;		
						}
					}
				}
			});
			return ca0;
		}
		let score_point = 0;
		let ma_service = ma.slice();
		while (ma.length > 0) {
			let ca = find_dog(ma_service, [], 0);
			let ca_ = ca.slice();
			ma = ma_service.slice();
			if (ca_.length > 0) fa.push(ca_);
		}
		fa.forEach ((iss) => {
			let cur_score = 0, cur_length = 0;
			iss.forEach((is) => {
				if (is.length == 4)	{
					cur_length++;
					cur_score = cur_length + cur_score;
				}
			});
			score_point = score_point + cur_score;
		});
		let bw = !wh ? 'black' : 'white';
		return score_point;
	}
	this.make_move = () => {
		let white = this.turn % 2 == 0;
		let f0 = this.field[this.selected_cells[0][0]][this.selected_cells[0][1]],
			f1 = this.field[this.selected_cells[1][0]][this.selected_cells[1][1]];

		//console.log('--------------' + this.turn + '----------------');
		
		f0.select();f1.select();
		if ((f1.value == 1 || f1.value == 2) && f1.value == f0.value) {
			this.make_bridge(f0, f1);
		} else {		
			f0.value = white ? 1 : 2;
			f1.value = white ? 1 : 2;
		}
		if (this.turn < this.history.length) {
			for (var i = this.history.length - 1; i > this.turn - 1; i-- ) {
				this.history[i].button.remove();
				this.history.pop();
			}
		}
		if (this.turn == this.history.length && this.base_move.classList.contains('grey')) {
			this.base_move.classList.remove('grey');
		}
		this.history[this.turn] = {
				'move': this.selected_cells,
				'main_line': true,
				'secondary': [],
				'position': [],
				'turn': this.turn,
				'button': this.base_move.cloneNode(false),
		}
			this.field.forEach ((xf) => {
				let cyu = [];
				xf.forEach ((yf) => {
					cyu.push({
						'value': yf.value,
						'bridge': yf.bridge,
						'allow': yf.allow,
					});
				});
				this.history[this.turn].position.push(cyu);
			});
			this.history[this.turn].button.innerHTML = (this.turn + 1) + ". " + 'abcdefjklmn'[this.selected_cells[0][0]] +
				(1 + +this.selected_cells[0][1]) + " " + 'abcdefjklmn'[this.selected_cells[1][0]] + (1 + +this.selected_cells[1][1]);
			let t = this.turn;
			this.history[this.turn].button.id = this.turn;
			this.history[this.turn]['button_innerHTML'] = this.history[this.turn].button.innerHTML;
			this.history[this.turn]['button_id'] = t;
			this.history[this.turn].button.addEventListener('click', this.load_position);
			this.moves_block.insertBefore(this.history[this.turn].button, this.base_move);

		this.turn++;

		this.base_move.innerHTML = (this.turn + 1) + ". _____";
		this.move_pointer.classList.toggle("black");
		this.move_pointer.classList.toggle("white");
		this.move_pointer.innerHTML = this.turn + 1;
		this.selected_cells = [[-1, -1], [-1, -1]];
		this.islands = this.fi(this.field);
		if (!white) {
			this.black_p.innerHTML = this.score (this.islands, this.field, white);
		} else {
			this.white_p.innerHTML = this.score (this.islands, this.field, white);
		}
		this.field = this.set_impassable(this.field, this.islands);
		this.refresh_allow();
		let a = this.get_allow_moves(this.field, !white);
		this.allow_moves = a[0];
		//console.log('this.allow_moves ', a[1] );
	}
	this.islands = {'black': [], 'white': [], 'all': []}
	
	// find islands
	this.fi = function (p) {
		let islands = {'black': [], 'white': [], 'all': []}
		let ca = []; //check array
		let is = []; //islands
		for(var i = 0; i < this.size; i++) {
			ca[i] = [];
			for (var i2 = 0; i2 < this.size; i2++) {
				ca[i][i2] = -1;
			}
		}
		for (var x = 0; x < this.size; x++) {
			for (var y = 0; y < this.size; y++) {
				if (ca[x][y] > -1) {continue;}
				let ci = []; //current island
				is.push(ci);
				let n = is.length - 1;
				let count = 0;
				var find_dog = function (xf, yf) {
					count++;
					let point = [];
					point[0] = xf,
					point[1] = yf;
					if (count > 100) {return;}
					ci.push([point[0], point[1]]);
					ca[point[0]][point[1]] = n;
					let ia = [[0,-1],[1,0],[0,1],[-1,0]]; //increment array
					ia = ia.filter ( item => point[0] + item[0] > -1 && point[1] + item[1] > -1 && point[0] + item[0] < 10 && point[1] + item[1] < 10);
					ia.forEach((i) => {
						if (p[point[0] + i[0]][point[1] + i[1]].value == p[point[0]][point[1]].value && ca[point[0] + i[0]][point[1] + i[1]] != ca[point[0]][point[1]]) {
							find_dog(point[0] + i[0], point[1] + i[1]);
						}
					});
				}
				find_dog(x,y);
				is[n] = ci;
				if (p[x][y].value == 1) {islands.white.push(ci); }
				if (p[x][y].value == 2) {islands.black.push(ci); }
				islands.all.push(ci);
			}
		} 
		return islands;
	}

	this.load_position = (event) => {
		let clear = false, pos = [], t = 0, walk = false;
		if (typeof event == "number") {
			pos = this.history[event].position;
			walk = false;
			t = event + 1;
		} else {
			let id = event.target.id;
			if (typeof id == "indefined") {return;}
			else {
				if (id == "btnnew") {clear = true;}
				else {
					if (!isNaN(id)) {
						if (id == 0) {clear = true;}
						else {
							pos = this.history[+id - 1].position;
							t = this.history[+id].turn;
						}
					} else {
						if (id == "back") {
							t = this.turn - 2;
							if (t < 0) {return;}
							else {pos = this.history[t].position; walk = true;}
							t++;
						}
						if (id == "forward") {
							t = this.turn;
							if (t > this.history.length -1) {return;}
							else {pos = this.history[t].position; walk = true;}
							t++;
						}
					}
				}
			}
		}

		this.selected_cells = [[-1, -1], [-1, -1]];
		this.turn = typeof t == "undefined" ? 0 : t;
		this.bridges.forEach((item) => {
			item.line.remove();
		});
		this.bridges = [];
		for (var i = 0; i < this.size; i++)	{
			for (var i2 = 0; i2 < this.size; i2++) {
				if (clear) {
					this.field[i][i2].value = 0;
					this.field[i][i2].bridge = [];
					this.field[i][i2].allow = true;
				} else {
					this.field[i][i2].value = pos[i][i2].value;
					this.field[i][i2].bridge = pos[i][i2].bridge;
					this.field[i][i2].allow = pos[i][i2].allow;
				}
				this.field[i][i2].reset();
				this.field[i][i2].rect.show();
				if (this.field[i][i2].bridge.length > 0) {
					let p2b = this.field[i][i2].bridge;
					if (p2b[0] + p2b[1] < i + i2) {continue;}
					this.field[i][i2].bridge = [];
					this.field[p2b[0]][p2b[1]].bridge = [];
					this.selected_cells = [[i, i2], [p2b[0], p2b[1]]];
					this.make_bridge(this.field[i][i2], this.field[p2b[0]][p2b[1]]);
					this.selected_cells = [[-1, -1], [-1, -1]];
				}
			}
		}
		this.islands = this.fi(this.field);
		this.field = this.set_impassable(this.field, this.islands);
		this.refresh_allow();
		let wh = 0 == this.turn % 2;
		let a = this.get_allow_moves(this.field, !wh);
		this.allow_moves = a[0];
		if (clear) {
			this.history.forEach ((item) => {
				this.moves_block.removeChild(item.button);
			});
			this.history = [];
		}
		if (this.turn > 0) {
			let ba = this.moves_block.querySelectorAll('.move');
			for (var i = 0 ; i < this.turn; i++) {
				if (ba[i].classList.contains('grey')) { ba[i].classList.remove('grey'); }
				if (ba[i].classList.contains('close')) { ba[i].classList.remove('close'); }
			}
			for (var i = this.turn; i < ba.length; i++) {
				if (walk) {
					if (!ba[i].classList.contains('grey')) { ba[i].classList.add('grey'); }
				} else {
					if (!ba[i].classList.contains('close')) { ba[i].classList.add('close'); }
				}
			}
			this.base_move.classList.remove('close');
			if (this.turn == this.history.length && this.base_move.classList.contains('grey')) {
				this.base_move.classList.remove('grey');
			}
		}
		if (this.turn % 2 == 0) {
			this.move_pointer.classList.add('white');
			this.move_pointer.classList.remove('black');
		} else {
			this.move_pointer.classList.add('black');
			this.move_pointer.classList.remove('white');
		}
		this.move_pointer.innerHTML = (this.turn + 1) + " move";
		this.base_move.innerHTML = (this.history.length + 1) + ". _____";
	}

	this.set_impassable = function (p, is) {
		let po = p;
		[is.white, is.black].forEach((wb) => {
			wb.forEach ((i) => {
				if (i.length > 3) {
					let merge = po[i[0][0]][i[0][1]].value + 3; 
					i.forEach ((point) => {
						let ia = [[0,-1],[1,0],[0,1],[-1,0],[-1,-1],[1,1],[1, -1], [-1,1]]; //increment array
						ia = ia.filter ( item => point[0] + item[0] > -1 && point[1] + item[1] > -1 && point[0] + item[0] < 10 && point[1] + item[1] < 10);
						ia.forEach((inc) => {
							if (po[point[0] + inc[0]][point[1] + inc[1]].value == 0) {
								po[point[0] + inc[0]][point[1] + inc[1]].value = merge; 
							}
							if (po[point[0] + inc[0]][point[1] + inc[1]].value > 3
								&& po[point[0] + inc[0]][point[1] + inc[1]].value != merge ) {
								po[point[0] + inc[0]][point[1] + inc[1]].value = 6; 
							}
						});
					});
				}
			});
		});
		return po;
	}

	this.game_select = function (event) {
		if (event.target.id == "game_list") {
			event.target.classList.toggle('is_open');
		}
	}
	this.click_on_save_dialog = (event) => {
		if (event.target.id == "save_dialog") {
			event.target.classList.toggle('is_open');
			return;
		}
		if (event.target.id == 'saves') {
			return;
		}
	}

	this.save_party = (event) => {
		if (typeof event != "undefined") {event.preventDefault();}
		let party = this.game_name.value;
		console.log(party);
		party = party.trim().toLowerCase();
		let party2 = '';
		if (party.length > 0) {
			for(var i = 0; i < party.length; i++) {
				if ('qwertyuiopasdfghjklzxcvbnm_1234567890.,-()'.indexOf(party[i], 0) > 0) {
					party2 = party2 + party[i];
				}
			}
			party2.trim().replace(/ /gi, '_');
			this.save_dialog.classList.toggle('is_open');
			this.game_name.value = '';
			let d = new Date();
			this.archive[party2] = {
				'history': this.history,
				'date': d.getFullYear() + '_' + d.getMonth() + '_' + d.getDate(),
			}
			localStorage.setItem('archive', JSON.stringify(this.archive));
		}
		console.log(party2);
		this.load_archive();
	}
	this.find_move = (p, wh) => {
		let pos = [], w = true, am = [], p1 = [];
		if (typeof p == "undefined") {
			p1 = this.field.slice();
			w = this.turn % 2 == 0;
		} else {
			w = wh;
			p1 = p;
		}
		let copy_a = function(pp) {
			let pp0 = [];
			pp.forEach((xi, i0) => {
				pp0.push([]);
				xi.forEach((yi, i1) => {
					pp0[i0][i1] = {
						'value': yi.value,
						'bridge': yi.bridge.slice(),
						'allow': yi.allow,
					}
				});
			});
			return pp0;
		}
		pos = copy_a(p1);
		am = this.get_allow_moves(pos, !w);
		let pw = copy_a(pos);
		let max_score = 0;
		let best = [];
		let mv = w ? 1 : 2;
		am[1].forEach ((m) => {
			if (pw[m[0][0]][m[0][1]] == mv && pw[m[1][0]][m[1][1]] == mv) {
				pw[m[0][0]][m[0][1]].bridge = [m[1][0], m[1][1]];
				console.log('bridge in searcg best move',[m[1][0], m[1][1]]);
			} else {
				pw[m[0][0]][m[0][1]].value = mv;
				pw[m[1][0]][m[1][1]].value = mv;
			}
			let fi_arr = this.fi(pw, w);
			let score = this.score(fi_arr, pw, w);
			if (!(score < max_score)) {
				max_score = score;
				best.push([[m[0][0], m[0][1]], [m[1][0], m[1][1]], max_score]);
				best.forEach((b, bi) => {if (b[2] < max_score) { best.splice(bi, 1);}});
			}
			pw = copy_a(pos);
		});
		console.log(max_score);
		return best;
	}
	
	this.btn_new.addEventListener('click', this.load_position);
	this.back.addEventListener('click', this.load_position);
	this.forward.addEventListener('click', this.load_position);
	this.save.addEventListener('click', () => {
		this.save_dialog.classList.toggle('is_open');
	});
	this.load.addEventListener('click', () => {
		this.game_list.classList.toggle('is_open');
	});
	this.game_list.addEventListener('click', this.game_select);
	this.save_dialog.addEventListener('click', this.click_on_save_dialog)
	this.close_modal.forEach((item) => {item.addEventListener('click', (event) => {
		event.target.parentElement.parentElement.classList.toggle('is_open');
	});});
	this.saveas.addEventListener('click', this.save_party);
	
	
	document.addEventListener('keypress', (event) => {
		if (this.save_dialog.classList.contains("is_open")) {return;}
		if( '123456789'.indexOf(event.key) > -1) {
			let fm = this.find_move();
			console.log(fm);
		}
	});
}
