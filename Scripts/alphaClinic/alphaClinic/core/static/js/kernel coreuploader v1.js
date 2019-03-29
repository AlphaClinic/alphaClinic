; /* /bitrix/js/main/core/core_uploader/common.js?153814486515583*/
; /* /bitrix/js/main/core/core_uploader/uploader.min.js?154461981338697*/
; /* /bitrix/js/main/core/core_uploader/file.js?154168962338322*/
; /* /bitrix/js/main/core/core_uploader/queue.min.js?151801858511002*/

; /* Start:"a:4:{s:4:"full";s:60:"/bitrix/js/main/core/core_uploader/common.js?153814486515583";s:6:"source";s:44:"/bitrix/js/main/core/core_uploader/common.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
;(function(window){
	if (window.BX["UploaderUtils"])
		return false;
	var BX = window.BX;
	BX.UploaderLog = [];
	BX.UploaderDebug = false;
	var statuses = { "new" : 0, ready : 1, preparing : 2, inprogress : 3, done : 4, failed : 5, stopped : 6, changed : 7, uploaded : 8};
	BX.UploaderUtils = {
		statuses : statuses,
		getId : function() { return (new Date().valueOf() + Math.round(Math.random() * 1000000)); },
		log : function(){
			if (BX.UploaderDebug === true)
			{
				console.log(arguments);
			}
			else
			{
				BX.UploaderLog.push(arguments);
			}
		},
		Hash : (function(){
			var d = function() {
				this.length = 0;
				this.items = {};
				this.order = [];
				var i;
				if (arguments.length == 1 && BX.type.isArray(arguments[0]) && arguments[0].length > 0)
				{
					var data = arguments[0];
					for (i = 0; i < data.length; i++)
					{
						if (data[i] && typeof data[i] == "object" && data[i]["id"])
						{
							this.setItem(data[i]["id"], data[i]);
						}
					}
				}
				else
				{
					for (i = 0; i < arguments.length; i += 2)
						this.setItem(arguments[i], arguments[i + 1]);
				}
			};
			d.prototype = {
				getIds : function()
				{
					return this.order;
				},
				getQueue : function(id)
				{
					id += '';
					return BX.util.array_search(id, this.order);
				},
				getByOrder : function(order)
				{
					return this.getItem(this.order[order]);
				},
				removeItem : function(in_key)
				{
					in_key += '';
					var tmp_value, number;
					if (typeof(this.items[in_key]) != 'undefined') {
						tmp_value = this.items[in_key];
						number = this.getQueue(in_key);
						this.pointer -= (this.pointer >= number ? 1 : 0);
						delete this.items[in_key];
						this.order = BX.util.deleteFromArray(this.order, number);
						this.length = this.order.length;

					}
					return tmp_value;
				},

				getItem : function(in_key) {
					in_key += '';
					return this.items[in_key];
				},

				unshiftItem : function(in_key, in_value)
				{
					in_key += '';
					if (typeof(in_value) != 'undefined')
					{
						if (typeof(this.items[in_key]) == 'undefined')
						{
							this.order.unshift(in_key);
							this.length = this.order.length;
						}
						this.items[in_key] = in_value;
					}
					return in_value;
				},
				setItem : function(in_key, in_value)
				{
					in_key += '';
					if (typeof(in_value) != 'undefined')
					{
						if (typeof(this.items[in_key]) == 'undefined')
						{
							this.order.push(in_key);
							this.length = this.order.length;
						}
						this.items[in_key] = in_value;
					}
					return in_value;
				},

				hasItem : function(in_key)
				{
					in_key += '';
					return typeof(this.items[in_key]) != 'undefined';
				},
				insertBeforeItem : function(in_key, in_value, after_key)
				{
					in_key += '';
					if (typeof(in_value) != 'undefined')
					{
						if (typeof(this.items[in_key]) == 'undefined')
						{
							this.order.splice(this.getQueue(after_key), 0, in_key);
							this.length = this.order.length;
						}
						this.items[in_key] = in_value;
					}
					return in_value;
				},
				getFirst : function()
				{
					var in_key, item = null;
					for (var ii = 0; ii < this.order.length; ii++)
					{
						in_key = this.order[ii];
						if (!!in_key && this.hasItem(in_key))
						{
							item = this.getItem(in_key);
							break;
						}
					}
					return item;
				},
				getNext : function()
				{
					this.pointer = (0 <= this.pointer && this.pointer < this.order.length ? this.pointer : -1);
					var res = this.getItem(this.order[this.pointer + 1]);
					if (!!res)
						this.pointer++;
					else
						this.pointer = -1;
					return res;
				},
				getPrev : function()
				{
					this.pointer = (0 <= this.pointer && this.pointer < this.order.length ? this.pointer : 0);
					var res = this.getItem(this.order[this.pointer - 1]);
					if (!!res)
						this.pointer--;
					return res;
				},
				reset : function()
				{
					this.pointer = -1;
				},
				setPointer : function(in_key)
				{
					this.pointer = this.getQueue(in_key);
					return this.pointer;
				},
				getLast : function()
				{
					var in_key, item = null;
					for (var ii = this.order.length; ii >=0; ii--)
					{
						in_key = this.order[ii];
						if (!!in_key && this.hasItem(in_key))
						{
							item = this.getItem(in_key);
							break;
						}
					}
					return item;
				}
			};
			return d;
		})(),
		getFileNameOnly : function (name)
		{
			var delimiter = "\\", start = name.lastIndexOf(delimiter), finish = name.length;
			if (start == -1)
			{
				delimiter = "/";
				start = name.lastIndexOf(delimiter);
			}
			if ((start + 1) == name.length)
			{
				finish = start;
				start = name.substring(0, finish).lastIndexOf(delimiter);
			}
			name = name.substring(start + 1, finish);
			if (delimiter == "/" && name.indexOf("?") > 0)
			{
				name = name.substring(0, name.indexOf("?"));
			}

			if (name == '')
				name = 'noname';
			return name;
		},
		isImageExt : function(ext)
		{
			return (BX.message('bxImageExtensions') && BX.type.isNotEmptyString(ext) ?
				(new RegExp('(?:^|\\W)(' + ext + ')(?:\\W|$)', 'gi')).test(BX.message('bxImageExtensions')) :
				false
			);
		},
		isImage : function(name, type, size)
		{
			size = BX.type.isNumber(size) ? size : (BX.type.isNotEmptyString(size) && !(/[\D]+/gi.test(size)) ? parseInt(size) : null);
			return (
				(type === null || (type || '').indexOf("image/") === 0) &&
				(size === null || (size < 20 * 1024 * 1024)) &&
				BX.UploaderUtils.isImageExt((name || '').lastIndexOf('.') > 0 ? name.substr(name.lastIndexOf('.')+1).toLowerCase() : ''));
		},
		scaleImage : function(arSourceSize, arSize, resizeType)
		{
			var sourceImageWidth = parseInt(arSourceSize["width"]), sourceImageHeight = parseInt(arSourceSize["height"]);
			resizeType = (!resizeType && !!arSize["type"] ? arSize["type"] : resizeType);
			arSize = (!!arSize ? arSize : {});
			arSize.width = parseInt(!!arSize.width ? arSize.width : 0);
			arSize.height = parseInt(!!arSize.height ? arSize.height : 0);

			var res = {
					bNeedCreatePicture : false,
					source : {x : 0, y : 0, width : 0, height : 0},
					destin : {x : 0, y : 0, width : 0, height : 0}
			}, width, height;

			if (!(sourceImageWidth > 0 || sourceImageHeight > 0))
			{
				BX.DoNothing();
			}
			else
			{
				if (!BX.type.isNotEmptyString(resizeType))
				{
					resizeType = "inscribed";
				}


				var ResizeCoeff, iResizeCoeff;

				if (resizeType.indexOf("proportional") >= 0)
				{
					width = Math.max(sourceImageWidth, sourceImageHeight);
					height = Math.min(sourceImageWidth, sourceImageHeight);
				}
				else
				{
					width = sourceImageWidth;
					height = sourceImageHeight;
				}
				if (resizeType == "exact")
				{
					var
						ratio = (sourceImageWidth / sourceImageHeight < arSize["width"] / arSize["height"] ? arSize["width"] / sourceImageWidth : arSize["height"] / sourceImageHeight),
						x = Math.max(0, Math.round(sourceImageWidth / 2 - (arSize["width"] / 2) / ratio)),
						y = Math.max(0, Math.round(sourceImageHeight / 2 - (arSize["height"] / 2) / ratio));

					res.bNeedCreatePicture = true;
					res.coeff = ratio;

					res.destin["width"] = arSize["width"];
					res.destin["height"] = arSize["height"];

					res.source["x"] = x;
					res.source["y"] = y;
					res.source["width"] = Math.round(arSize["width"] / ratio, 0);
					res.source["height"] = Math.round(arSize["height"] / ratio, 0);
				}
				else
				{
					if (resizeType == "circumscribed")
					{
						ResizeCoeff = {
							width : (width > 0 ? arSize["width"] / width : 1),
							height: (height > 0 ? arSize["height"] / height : 1)};

						iResizeCoeff = Math.max(ResizeCoeff["width"], ResizeCoeff["height"], 1);
					}
					else
					{
						ResizeCoeff = {
							width : (width > 0 ? arSize["width"] / width : 1),
							height: (height > 0 ? arSize["height"] / height : 1)};

						iResizeCoeff = Math.min(ResizeCoeff["width"], ResizeCoeff["height"], 1);
						iResizeCoeff = (0 < iResizeCoeff ? iResizeCoeff : 1);
					}
					res.bNeedCreatePicture = (iResizeCoeff != 1);
					res.coeff = iResizeCoeff;
					res.destin["width"] = Math.max(1, parseInt(iResizeCoeff * sourceImageWidth));
					res.destin["height"] = Math.max(1, parseInt(iResizeCoeff * sourceImageHeight));

					res.source["x"] = 0;
					res.source["y"] = 0;
					res.source["width"] = sourceImageWidth;
					res.source["height"] = sourceImageHeight;
				}

			}
			return res;
		},
		dataURLToBlob : function(dataURL)
		{
			var marker = ';base64,', parts, contentType, raw, rawLength;
			if(dataURL.indexOf(marker) == -1) {
				parts = dataURL.split(',');
				contentType = parts[0].split(':')[1];
				raw = parts[1];
				return new Blob([raw], {type: contentType});
			}

			parts = dataURL.split(marker);
			contentType = parts[0].split(':')[1];
			raw = window.atob(parts[1]);
			rawLength = raw.length;

			var uInt8Array = new Uint8Array(rawLength);

			for(var i = 0; i < rawLength; ++i) {
				uInt8Array[i] = raw.charCodeAt(i);
			}

			return new Blob([uInt8Array], {type: contentType});
		},
		sizeof : function(obj) {
			var size = 0, key;
			for (key in obj) {
				if (obj.hasOwnProperty(key))
				{
					size += key.length;
					if (typeof obj[key] == "object")
					{
						if (obj[key] === null)
							BX.DoNothing();
						else if (obj[key]["size"] > 0)
							size += obj[key].size;
						else
							size += BX.UploaderUtils.sizeof(obj[key]);
					}
					else if (typeof obj[key] == "number")
					{
						size += obj[key].toString().length;
					}
					else if (!!obj[key] && obj[key].length > 0)
					{
						size += obj[key].length;
					}
				}
			}
			return size;
		},
		FormToArray : function(form, data)
		{
			return BX.ajax.prepareForm(form, data);
		},
		getFormattedSize : function (size, precision)
		{
			var a = ["b", "Kb", "Mb", "Gb", "Tb"], pos = 0;
			while(size >= 1024 && pos < 4)
			{
				size /= 1024;
				pos++;
			}
			return (Math.round(size * (precision > 0 ? precision * 10 : 1) ) / (precision > 0 ? precision * 10 : 1)) +
				" " + BX.message("FILE_SIZE_" + a[pos]);
		},
		bindEvents : function(obj, event, func)
		{
			var funcs = [], ii;
			if (typeof func == "string")
			{
				eval('funcs.push(' + func + ');');
			}
			else if (!!func["length"] && func["length"] > 0)
			{
				for(ii = 0; ii < func.length; ii++)
				{
					if (typeof func[ii] == "string")
						eval('funcs.push(' + func[ii] + ');');
					else
						funcs.push(func[ii]);
				}
			}
			else
				funcs.push(func);
			if (funcs.length > 0)
			{
				for (ii = 0; ii < funcs.length; ii++)
				{
					BX.addCustomEvent(obj, event, funcs[ii]);
				}
			}

		},
		applyFilePart : function(file, blob)
		{
			if (BX.type.isDomNode(file))
			{
				file.uploadStatus = statuses.done;
			}
			else if (file == blob)
			{
				file.uploadStatus = statuses.done;
			}
			else if (file.blobed === true)
			{
				file.uploadStatus = ((file.package + 1) >= file.packages ? statuses.done : statuses.inprogress);
				if (file.uploadStatus == statuses.inprogress)
					file.package++;
			}
			return true;
		},
		getFilePart : function(file, firstChunk, MaxFilesize)
		{
			var blob, chunkSize = MaxFilesize, start, end, chunk = null;
			if (BX.type.isDomNode(file))
			{
//				file.uploadStatus = statuses.done;
				blob = file;
			}
			else if (!(MaxFilesize > 0 && file.size > MaxFilesize))
			{
//				file.uploadStatus = statuses.done;
				blob = file;
			}
			else if (window.Blob || window.MozBlobBuilder || window.WebKitBlobBuilder || window.BlobBuilder)
			{
				file.blobed = true;
				if (file.uploadStatus == statuses.inprogress)
				{
					start = file.firstChunk + (file.package - 1) * chunkSize;
					end = start + chunkSize;
				}
				else
				{
					firstChunk = (0 < firstChunk && firstChunk < chunkSize ? firstChunk : chunkSize);
					file.firstChunk = firstChunk;
					file.packages = 1 + Math.ceil((file.size-file.firstChunk) / chunkSize);
					file.package = 0;
					start = 0;
					end = file.firstChunk;
				}

				if('mozSlice' in file)
					blob = file.mozSlice(start, end, file.type);
				else if ('webkitSlice' in file)
					blob = file.webkitSlice(start, end, file.type);
				else if ('slice' in file)
					blob = file.slice(start, end, file.type);
				else
					blob = file.Slice(start, end, file.type);

				for (var ii in file)
				{
					if (file.hasOwnProperty(ii))
					{
						blob[ii] = file[ii];
					}
				}
				blob["name"] = file["name"];
				blob["start"] = start;
			}
			return blob;
		},
		makeAnArray : function(file, data)
		{
			file = (!!file ? file : {files : [], props : {}});
			var ii;
			for (var jj in data)
			{
				if (data.hasOwnProperty(jj))
				{
					if (typeof data[jj] == "object" && data[jj].length > 0)
					{
						file[jj] = (!!file[jj] ? file[jj] : []);
						for (ii=0; ii<data[jj].length; ii++)
						{
							file[jj].push(data[jj][ii]);
						}
					}
					else
					{

						for (ii in data[jj])
						{
							if (data[jj].hasOwnProperty(ii))
							{
								file[jj] = (!!file[jj] ? file[jj] : {});
								file[jj][ii] = data[jj][ii];
							}
						}
					}
				}
			}
			return file;
		},
		appendToForm : function(fd, key, val)
		{
			if (!!val && typeof val == "object")
			{
				for (var ii in val)
				{
					if (val.hasOwnProperty(ii))
					{
						BX.UploaderUtils.appendToForm(fd, key + '[' + ii + ']', val[ii]);
					}
				}
			}
			else
			{
				fd.append(key, (!!val ? val : ''));
			}
		},
		FormData : function()
		{
			return new (BX.Uploader.getInstanceName() == "BX.UploaderSimple" ? FormDataLocal : window.FormData);
		},
		prepareData : function(arData)
		{
			var data = {};
			if (null != arData)
			{
				if(typeof arData == 'object')
				{
					for(var i in arData)
					{
						if (arData.hasOwnProperty(i))
						{
							var name = BX.util.urlencode(i);
							if(typeof arData[i] == 'object')
								data[name] = BX.UploaderUtils.prepareData(arData[i]);
							else
								data[name] = BX.util.urlencode(arData[i]);
						}
					}
				}
				else
					data = BX.util.urlencode(arData);
			}
			return data;
		}
	};
	var FormDataLocal = function()
	{
		var uniqueID;
		do {
			uniqueID = Math.floor(Math.random() * 99999);
		} while(BX("form-" + uniqueID));
		this.local = true;
		this.form = BX.create("FORM", {
			props: {
				id: "form-" + uniqueID,
				method: "POST",
				enctype: "multipart/form-data",
				encoding: "multipart/form-data"
			},
			style: {display: "none"}
		});
		document.body.appendChild(this.form);
	};
	FormDataLocal.prototype = {
		append : function(name, val)
		{
			if (BX.type.isDomNode(val))
			{
				this.form.appendChild(val);
			}
			else
			{
				this.form.appendChild(
					BX.create("INPUT", {
							props : {
								type : "hidden",
								name : name,
								value : val
							}
						}
					)
				);
			}
		}
	};
	BX.UploaderUtils.slice = function(file, start, end)
	{
		var blob = null;
		if('mozSlice' in file)
			blob = file.mozSlice(start, end);
		else if ('webkitSlice' in file)
			blob = file.webkitSlice(start, end);
		else if ('slice' in file)
			blob = file.slice(start, end);
		else
			blob = file.Slice(start, end, file.type);
		return blob;
	};
	BX.UploaderUtils.readFile = function (file, callback, method)
	{
		if (window["FileReader"])
		{
			var fileReader = new FileReader();
			fileReader.onload = fileReader.onerror = callback;
			method = (method || 'readAsDataURL');
			if (fileReader[method])
			{
				fileReader[method](file);
				return fileReader;
			}
		}
		return false;
	};
}(window));

/* End */
;
; /* Start:"a:4:{s:4:"full";s:66:"/bitrix/js/main/core/core_uploader/uploader.min.js?154461981338697";s:6:"source";s:46:"/bitrix/js/main/core/core_uploader/uploader.js";s:3:"min";s:50:"/bitrix/js/main/core/core_uploader/uploader.min.js";s:3:"map";s:50:"/bitrix/js/main/core/core_uploader/uploader.map.js";}"*/
(function(window){if(window.BX["Uploader"])return;var BX=window.BX,statuses={new:0,ready:1,preparing:2,inprogress:3,done:4,failed:5,error:5.2,stopped:6,changed:7,uploaded:8},repo={},settings={phpPostMinSize:5.5*1024*1024,phpUploadMaxFilesize:5*1024*1024,phpPostMaxSize:11*1024*1024,estimatedTimeForUploadFile:10*60,maxTimeForUploadFile:15*60,maxSize:null};BX.UploaderManager=function(){};BX.UploaderManager.getById=function(e){return typeof repo[e]!="undefined"?repo[e]:false};BX.Uploader=function(e){if(settings.maxSize===null&&BX.message["bxDiskQuota"]&&BX.message("bxDiskQuota"))settings.maxSize=parseInt(BX.message("bxDiskQuota"));var t;if(!(typeof e=="object"&&e&&(BX(e["input"])||e["input"]===null))){BX.debug(BX.message("UPLOADER_INPUT_IS_NOT_DEFINED"))}else{if(parseInt(BX.message("phpMaxFileUploads"))<=0)t={phpMaxFileUploads:"20"};if(parseInt(BX.message("phpPostMaxSize"))<=0){t=t||{};t["phpPostMaxSize"]=settings.phpPostMaxSize+""}if(parseInt(BX.message("phpUploadMaxFilesize"))<=0){t=t||{};t["phpUploadMaxFilesize"]=settings.phpUploadMaxFilesize+""}if(t)BX.message(t);this.fileInput=e["input"]===null?null:BX(e["input"]);this.controlID=this.controlId=e["controlId"]||"bitrixUploader";this.dialogName="BX.Uploader";this.id=BX.type.isNotEmptyString(e["id"])?e["id"]:Math.random();this.CID=e["CID"]&&BX.type.isNotEmptyString(e["CID"])?e["CID"]:"CID"+BX.UploaderUtils.getId();this.streams=new BX.UploaderStreams(e["streams"],this);this.limits={phpMaxFileUploads:parseInt(BX.message("phpMaxFileUploads")),phpPostMaxSize:Math.min(parseInt(BX.message("phpPostMaxSize")),settings.phpPostMaxSize),phpUploadMaxFilesize:Math.min(parseInt(BX.message("phpUploadMaxFilesize")),settings.phpUploadMaxFilesize),uploadMaxFilesize:e["uploadMaxFilesize"]&&e["uploadMaxFilesize"]>0?e["uploadMaxFilesize"]:0,uploadFileWidth:e["uploadFileWidth"]&&e["uploadFileWidth"]>0?e["uploadFileWidth"]:0,uploadFileHeight:e["uploadFileHeight"]&&e["uploadFileHeight"]>0?e["uploadFileHeight"]:0,allowUpload:e["allowUpload"]=="A"||e["allowUpload"]=="I"||e["allowUpload"]=="F"?e["allowUpload"]:"A",allowUploadExt:typeof e["allowUploadExt"]==="string"?e["allowUploadExt"]:""};var s=["phpMaxFileUploads","phpPostMaxSize","phpUploadMaxFilesize"];for(t=0;t<s.length;t++){this.limits[s[t]]=typeof e[s[t]]=="number"&&e[s[t]]<this.limits[s[t]]?e[s[t]]:this.limits[s[t]]}this.limits["phpPostSize"]=Math.min(this.limits["phpPostMaxSize"],settings.phpPostMinSize);this.limits["uploadFile"]=e["allowUpload"]=="I"?"image/*":"";this.limits["uploadFileExt"]=this.limits["allowUploadExt"];if(this.limits["uploadFileExt"].length>0){var i=this.limits["uploadFileExt"].split(this.limits["uploadFileExt"].indexOf(",")>=0?",":" ");for(t=0;t<i.length;t++)i[t]=i[t].charAt(0)=="."?i[t].substr(1):i[t];this.limits["uploadFileExt"]=i.join(",")}this.params=e;this.params["filesInputName"]=this.fileInput&&this.fileInput["name"]?this.fileInput["name"]:"FILES";this.params["filesInputMultiple"]=this.fileInput&&this.fileInput["multiple"]||this.params["filesInputMultiple"]?"multiple":false;this.params["uploadFormData"]=this.params["uploadFormData"]=="N"?"N":"Y";this.params["uploadMethod"]=this.params["uploadMethod"]=="immediate"?"immediate":"deferred";this.params["uploadFilesForPackage"]=parseInt(this.params["uploadFilesForPackage"]>0?this.params["uploadFilesForPackage"]:0);this.params["imageExt"]="jpg,bmp,jpeg,jpe,gif,png";this.params["uploadInputName"]=!!this.params["uploadInputName"]?this.params["uploadInputName"]:"bxu_files";this.params["uploadInputInfoName"]=!!this.params["uploadInputInfoName"]?this.params["uploadInputInfoName"]:"bxu_info";this.params["deleteFileOnServer"]=!(this.params["deleteFileOnServer"]===false||this.params["deleteFileOnServer"]==="N");this.params["pasteFileHashInForm"]=!(this.params["pasteFileHashInForm"]===false||this.params["pasteFileHashInForm"]==="N");repo[this.id]=this;if(this.init(this.fileInput)){if(!!e["dropZone"])this.initDropZone(BX(e["dropZone"]));if(!!e["events"]){for(t in e["events"]){if(e["events"].hasOwnProperty(t)){BX.UploaderUtils.bindEvents(this,t,e["events"][t])}}}this.uploadFileUrl=!!e["uploadFileUrl"]?e["uploadFileUrl"]:this.form?this.form.getAttribute("action"):"";if(!this.uploadFileUrl||this.uploadFileUrl.length<=0){BX.debug(BX.message("UPLOADER_ACTION_URL_NOT_DEFINED"))}this.status=statuses.ready;this.fileFields=e["fields"];this.fileCopies=e["copies"];var a=!!e["queueFields"]?e["queueFields"]:{};a["placeHolder"]=BX(a["placeHolder"]||e["placeHolder"]);a["showImage"]=a["showImage"]||e["showImage"];a["sortItems"]=a["sortItems"]||e["sortItems"];a["thumb"]=a["thumb"]||e["thumb"];this.queue=new BX.UploaderQueue(a,this.limits,this);this.params["doWeHaveStorage"]=true;BX.addCustomEvent(this,"onDone",BX.delegate(function(){this.init(this.fileInput)},this));if(!!this.params["filesInputName"]&&this.params["pasteFileHashInForm"]){BX.addCustomEvent(this,"onFileIsUploaded",BX.delegate(function(t,s){var i=BX.create("INPUT",{props:{type:"hidden",name:this.params["filesInputName"]+"[]",value:s.hash}});if(BX(e["placeHolder"])&&BX(t+"Item"))BX(t+"Item").appendChild(i);else if(this.fileInput!==null)this.fileInput.parentNode.insertBefore(i,this.fileInput)},this))}if(this.params["deleteFileOnServer"]){BX.addCustomEvent(this,"onFileIsDeleted",BX.delegate(function(e,t){if(!!t&&!!t.hash){var s=this.preparePost({mode:"delete",hash:t.hash},false);BX.ajax.get(this.uploadFileUrl,s.data)}},this))}BX.onCustomEvent(window,"onUploaderIsInited",[this.id,this]);this.uploads=new BX.UploaderUtils.Hash;this.upload=null;if(this.params["bindBeforeUnload"]===false){this.__beforeunload=BX.delegate(this.terminate,this)}else{this.__beforeunload=BX.delegate(function(e){if(this.uploads&&this.uploads.length>0){var t=BX.message("UPLOADER_UPLOADING_ONBEFOREUNLOAD");(e||window.event).returnValue=t;return t}},this)}BX.bind(window,"beforeunload",this.__beforeunload)}}};BX.Uploader.prototype={init:function(e){this.log("input is initialized");if(BX(e)){if(e==this.fileInput&&!this.form)this.form=this.fileInput.form;if(e==this.fileInput)e=this.fileInput=this.mkFileInput(e);else e=this.mkFileInput(e);BX.onCustomEvent(this,"onFileinputIsReinited",[e,this]);if(e){BX.bind(e,"change",BX.delegate(this.onChange,this));return true}}else if(e===null&&this.fileInput===null){this.log("Initialized && null");return true}return false},destruct:function(){this.releaseDropZone()},log:function(e){BX.UploaderUtils.log("uploader",e)},initDropZone:function(e){var t=null;if(!!BX.DD&&BX.type.isDomNode(e)&&e.parentNode){t=new BX.DD.dropFiles(e);if(t&&t.supported()&&BX.ajax.FormData.isSupported()){t.f={dropFiles:BX.delegate(function(e,t){if(t&&t["dataTransfer"]&&t["dataTransfer"]["items"]&&t["dataTransfer"]["items"].length>0){var s=t["dataTransfer"],i,a,o=[],r=false;for(i=0;i<s["items"].length;i++){if(s["items"][i]["webkitGetAsEntry"]&&s["items"][i]["getAsFile"]){r=true;a=s["items"][i]["webkitGetAsEntry"]();if(a&&a.isFile){o.push(s["items"][i]["getAsFile"]())}}}if(r)e=o}this.onChange(e)},this),dragEnter:function(e){var s=false;if(e&&e["dataTransfer"]&&e["dataTransfer"]["types"]){for(var i=0;i<e["dataTransfer"]["types"].length;i++){if(e["dataTransfer"]["types"][i]==="Files"){s=true;break}}}if(s)BX.addClass(t.DIV,"bxu-file-input-over")},dragLeave:function(){BX.removeClass(t.DIV,"bxu-file-input-over")}};BX.addCustomEvent(t,"dropFiles",t.f.dropFiles);BX.addCustomEvent(t,"dragEnter",t.f.dragEnter);BX.addCustomEvent(t,"dragLeave",t.f.dragLeave)}if(this.params["dropZone"]==e){this.dropZone=t}}return t},releaseDropZone:function(){if(this.dropZone){BX.unbindAll(this.dropZone.DIV);this.dropZone.DIV.removeAttribute("dropzone");BX.removeCustomEvent(this.dropZone,"dropFiles",this.dropZone.f.dropFiles);BX.removeCustomEvent(this.dropZone,"dragEnter",this.dropZone.f.dragEnter);BX.removeCustomEvent(this.dropZone,"dragLeave",this.dropZone.f.dragLeave);delete this.dropZone.f.dropFiles;delete this.dropZone.f.dragEnter;delete this.dropZone.f.dragLeave;delete this.dropZone._cancelLeave;delete this.dropZone._prepareLeave;delete this.dropZone}},onAttach:function(e,t,s){s=s!==false;if(typeof e!=="undefined"&&e.length>0){if(!this.params["doWeHaveStorage"])this.queue.clear();if(!BX.type.isArray(e)){var i=[];for(var a=0;a<e.length;a++){i.push(e[a])}e=i}BX.onCustomEvent(this,"onAttachFiles",[e,t,this]);var o=false,r,l;t=typeof t=="object"&&!!t&&t.length>0?t:[];for(var n=0,p;n<e.length;n++){p=e[n];if(BX(p)&&p.value){r=(p.value.name||"").split(".").pop()}else{r=(p["name"]||p["tmp_url"]||"").split(".").pop();if(r.indexOf("?")>0)r=r.substr(0,r.indexOf("?"))}r=(BX.type.isNotEmptyString(r)?r:"").toLowerCase();l=(BX.type.isNotEmptyString(p["type"])?p["type"]:"").toLowerCase();if(s&&(this.limits["uploadFile"]=="image/*"&&(BX.type.isNotEmptyString(l)&&l.indexOf("image/")!==0||!BX.type.isNotEmptyString(l)&&this.params["imageExt"].indexOf(r)<0)||this.limits["uploadFileExt"].length>0&&this.limits["uploadFileExt"].indexOf(r)<0)){continue}BX.onCustomEvent(this,"onItemIsAdded",[p,t[n]||null,this]);o=true}if(o){BX.onCustomEvent(this,"onItemsAreAdded",[this]);if(this.params["uploadMethod"]=="immediate")this.submit()}}return false},onChange:function(e){BX.onCustomEvent(this,"onFileinputWillBeChanged",[e,this]);BX.PreventDefault(e);var t=e;if(e&&e.target)t=e.target.files;else if(!e&&BX(this.fileInput))t=this.fileInput.files;if(BX(this.fileInput)&&this.fileInput.disabled){BX.DoNothing()}else{BX.onCustomEvent(this,"onFileinputIsChanged",[e,this]);this.init(e&&e["target"]?e.target:e);this.onAttach(t)}return false},mkFileInput:function(e){if(!BX(e))return false;BX.unbindAll(e);var t=e.cloneNode(true);BX.adjust(t,{props:{value:""},attrs:{name:this.params["uploadInputName"]+"[]",multiple:this.params["filesInputMultiple"],accept:this.limits["uploadFile"],value:""}});e.parentNode.insertBefore(t,e);e.parentNode.removeChild(e);return t},preparePost:function(e,t){var s=BX.message.SITE_ID?BX.message("SITE_ID"):"";if(t===true&&this.params["uploadFormData"]=="Y"&&!this.post){var i={data:{AJAX_POST:"Y",SITE_ID:s,USER_ID:BX.message("USER_ID")},filesCount:0,size:10};i=this.form?BX.UploaderUtils.FormToArray(this.form,i):i;if(!!i.data[this.params["filesInputName"]]){i.data[this.params["filesInputName"]]=null;delete i.data[this.params["filesInputName"]]}if(!!i.data[this.params["uploadInputInfoName"]]){i.data[this.params["uploadInputInfoName"]]=null;delete i.data[this.params["uploadInputInfoName"]]}if(!!i.data[this.params["uploadInputName"]]){i.filesCount-=i.data[this.params["uploadInputName"]].length;i.data[this.params["uploadInputName"]]=null;delete i.data[this.params["uploadInputName"]]}if(this.limits["phpMaxFileUploads"]<=i.filesCount){BX.debug("You can not upload any file from your list.");return false}i.size=BX.UploaderUtils.sizeof(i.data);this.post=i}var a=t===true&&this.params["uploadFormData"]=="Y"?this.post:{data:{AJAX_POST:"Y",SITE_ID:s,USER_ID:BX.message("USER_ID")},filesCount:0,size:10},o=0;a.data["sessid"]=BX.bitrix_sessid();a.size+=6+BX.bitrix_sessid().length;if(e){a.data[this.params["uploadInputInfoName"]]={controlId:this.controlId,CID:this.CID,inputName:this.params["uploadInputName"],version:BX.Uploader.getVersion()};for(var r in e){if(e.hasOwnProperty(r)){a.data[this.params["uploadInputInfoName"]][r]=e[r]}}o=BX.UploaderUtils.sizeof(this.params["uploadInputInfoName"])+BX.UploaderUtils.sizeof(a.data[this.params["uploadInputInfoName"]])}a.length=a.size+o;return a},submit:function(){this.start()},stop:function(){this.terminate()},adjustProcess:function(e,t,s,i,a){var o="",r=0;if(this.queue.itFailed.hasItem(t.id)){o="response [we do not work with errors]"}else if(s==statuses.error){delete t.progress;this.queue.itFailed.setItem(t.id,t);this.queue.itForUpload.removeItem(t.id);BX.onCustomEvent(this,"onFileIsUploadedWithError",[t.id,t,i,this,a]);BX.onCustomEvent(t,"onUploadError",[t,i,this,a]);o="response [error]"}else if(s==statuses.uploaded){delete t.progress;this.queue.itUploaded.setItem(t.id,t);this.queue.itForUpload.removeItem(t.id);BX.onCustomEvent(this,"onFileIsUploaded",[t.id,t,i,this,a]);BX.onCustomEvent(t,"onUploadDone",[t,i,this,a]);o="response [uploaded]"}else if(s==statuses.inprogress){if(typeof i=="number"){if(i==0&&t.progress.status==statuses["new"]){BX.onCustomEvent(t,"onUploadStart",[t,0,this,a]);t.progress.status=statuses.inprogress}r=t.progress.uploaded+t.progress.streams[e]*i/100}else{t.progress.uploaded+=t.progress.streams[e];t.progress.streams[e]=0;r=t.progress.uploaded}o="response [uploading]. Uploaded: "+r;BX.onCustomEvent(t,"onUploadProgress",[t,r,this,a])}else if(s==statuses.failed){if(t.progress.streams[e]==t.progress.percentPerChunk){t.progress=null;delete t.progress}else{t.progress.streams[e]-=t.progress.percentPerChunk/i.packages;t.progress.streams[e]=t.progress.streams[e]>0?t.progress.streams[e]:0}}else{if(s==statuses["new"]){var l=(t.getThumbs("getCount")>0?t.getThumbs("getCount"):0)+2;t.progress={percentPerChunk:100/l,streams:{},uploaded:0,status:statuses["new"]};t.progress.streams[e]=t.progress.percentPerChunk;o="request preparing [start]. Prepared: "+t.progress.streams[e]}else if(s==statuses.preparing){t.progress.streams[e]=t.progress.streams[e]>0?t.progress.streams[e]:0;t.progress.streams[e]+=t.progress.percentPerChunk/i.packages;o+="request preparing [cont]. Prepared: "+t.progress.streams[e]}else{o="request preparing [finish]. "}BX.onCustomEvent(t,"onUploadPrepared",[t,i,this,a])}this.log(t.name+": "+o)},terminate:function(e){var t,s;if(!e||e=="beforeunload"){s=this.uploads;this.uploads=new BX.UploaderUtils.Hash;this.upload=null;while((t=s.getFirst())&&t){s.removeItem(t.id);this.terminate(t)}return}else if(BX.type.isNotEmptyString(e)){t=this.uploads.removeItem(e)}else if(typeof e=="object"){t=e}if(t&&t["stop"]){t.stop();this.log(t.id+" Uploading is canceled");BX.onCustomEvent(this,"onTerminated",[t.id,t])}},start:function(){if(this.queue.itForUpload.length<=0){BX.onCustomEvent(this,"onStart",[null,{filesCount:0},this]);BX.onCustomEvent(this,"onDone",[null,null,{filesCount:0}]);BX.onCustomEvent(this,"onFinish",[null,null,{filesCount:0}]);return}var e="pIndex"+BX.UploaderUtils.getId(),t=this.queue.itForUpload;this.queue.itForUpload=new BX.UploaderUtils.Hash;this.post=false;this.log("create new package "+e);var s=new BX.UploaderPackage({id:e,data:t,post:this.preparePost({},true),uploadFileUrl:this.uploadFileUrl,limits:this.limits,params:this.params},this);BX.addCustomEvent(s,"adjustProcess",BX.proxy(this.adjustProcess,this));BX.addCustomEvent(s,"startStream",BX.proxy(function(e,t,s){BX.onCustomEvent(this,"startPackage",[e,t.id,s])},this));BX.addCustomEvent(s,"progressStream",BX.proxy(function(e,t,s){BX.onCustomEvent(this,"processPackage",[e,t.id,s])},this));BX.addCustomEvent(s,"doneStream",BX.proxy(function(e,t,s){BX.onCustomEvent(this,"donePackage",[e,t.id,s])},this));BX.addCustomEvent(s,"stopPackage",BX.proxy(function(e){this.log("restore files: "+e.data.length);this.queue.restoreFiles(e.data)},this));BX.addCustomEvent(s,"donePackage",BX.proxy(function(e,t,s){BX.onCustomEvent(this,"onDone",[e,t.id,t,s]);var i=this.checkUploads(t.id);if(!i)BX.onCustomEvent(this,"onFinish",[e,t.id,t,s])},this));BX.addCustomEvent(s,"errorPackage",BX.proxy(function(t,s,i){BX.onCustomEvent(this,"error",[t,e,i]);BX.onCustomEvent(this,"onError",[t,e,i]);this.checkUploads(s.id)},this));BX.addCustomEvent(s,"processPackage",BX.proxy(function(e,t,s){BX.onCustomEvent(this,"processPackage",[e,t,s])},this));BX.onCustomEvent(this,"onStart",[e,s,this]);this.uploads.setItem(e,s);this.checkUploads()},checkUploads:function(e){if(e)this.uploads.removeItem(e);this.upload=this.uploads.getFirst();if(this.upload)this.upload.start(this.streams);return this.upload},getItem:function(e){return this.queue.getItem(e)},getItems:function(){return this.queue.items},restoreItems:function(){this.queue.restoreFiles.apply(this.queue,arguments)},clear:function(){var e;while((e=this.queue.items.getFirst())&&e){e.deleteFile()}}};BX.UploaderSimple=function(e){BX.UploaderSimple.superclass.constructor.apply(this,arguments);this.dialogName="BX.UploaderSimple";this.previews=new BX.UploaderUtils.Hash;if(this.params["uploadMethod"]!="immediate"){BX.addCustomEvent(this,"onFileNeedsPreview",BX.delegate(function(e,t){this.previews.setItem(t.id,t);this.log("onFileNeedsPreview: "+t.id);setTimeout(BX.delegate(this.onFileNeedsPreview,this),500)},this));BX.addCustomEvent(this,"onStart",BX.delegate(function(e,t){if(t&&t.filesCount>0){var s=t.raw.getIds(),i;for(i=0;i<s.length;i++){this.previews.removeItem(s[i])}}},this))}else{BX.addCustomEvent(this,"onFileIsUploaded",BX.delegate(function(e,t,s){this.dealWithFile(t,s)},this))}this.streams=new BX.UploaderStreams(1,this);return this};BX.extend(BX.UploaderSimple,BX.Uploader);BX.UploaderSimple.prototype.preparePost=function(){var e=BX.UploaderSimple.superclass.preparePost.apply(this,arguments);if(e&&e.data&&e.data[this.params["uploadInputInfoName"]]&&!e.data[this.params["uploadInputInfoName"]]["simpleUploader"]){e.data[this.params["uploadInputInfoName"]]["simpleUploader"]="Y";e.size+=15}return e};BX.UploaderSimple.prototype.init=function(e,t){this.log("input is initialized: "+(t!==false?"drop":" does not drop"));if(BX(e)){if(e==this.fileInput&&!this.form)this.form=this.fileInput.form;if(e==this.fileInput)e=this.fileInput=this.mkFileInput(e,t);else e=this.mkFileInput(e,t);BX.onCustomEvent(this,"onFileinputIsReinited",[e,this]);if(e){BX.bind(e,"change",BX.delegate(this.onChange,this));return true}}else if(e===null&&this.fileInput===null){this.log("Initialized && null");return true}return false};BX.UploaderSimple.prototype.log=function(e){BX.UploaderUtils.log("simpleup",e)};BX.UploaderSimple.prototype.mkFileInput=function(e,t){if(!BX(e))return false;BX.unbindAll(e);var s=e.cloneNode(true);BX.adjust(s,{attrs:{id:"",name:this.params["uploadInputName"]+"[file"+BX.UploaderUtils.getId()+"][default]",multiple:false,accept:this.limits["uploadFile"]}});e.parentNode.insertBefore(s,e);if(t!==false)e.parentNode.removeChild(e);return s};BX.UploaderSimple.prototype.onChange=function(e){BX.PreventDefault(e);e=e.target||e.srcElement||this.fileInput;if(BX(this.fileInput)&&this.fileInput.disabled){BX.DoNothing()}else{this.init(e,false);this.onAttach([e])}return false};BX.UploaderSimple.prototype.dealWithFile=function(e,t){var s;if(t&&t["status"]=="uploaded"&&t["hash"]&&t["file"]&&t["file"]["files"]&&t["file"]["files"]["default"]){s=t["file"]["files"]["default"]}if(s){e.file={name:s["name"],"~name":s["~name"],size:parseInt(s["size"]),type:s["type"],id:e.id,hash:t["hash"],copy:"default",url:s["url"],uploadStatus:statuses.done};e.nonProcessRun=true;BX.onCustomEvent(e,"onFileHasGotPreview",[e.id,e])}else{BX.onCustomEvent(e,"onFileHasNotGotPreview",[e.id,e])}};BX.UploaderSimple.prototype.onFileNeedsPreviewCallback=function(e,t){if(!(t&&t["files"])){this.log("onFileNeedsPreviewCallback is failed.");return}this.log("onFileNeedsPreviewCallback");this.onFileNeedsPreview();var s;while((s=e.result.getFirst())&&!!s){e.result.removeItem(s.id);this.dealWithFile(s,t["files"][s.id])}};BX.UploaderSimple.prototype.onFileNeedsPreview=function(){this.log("onFileNeedsPreview");var e=new BX.UploaderUtils.Hash,t;while(e.length<this.limits["phpMaxFileUploads"]&&(t=this.previews.getFirst())&&t&&t!==null){this.previews.removeItem(t.id);e.setItem(t.id,t)}if(e.length>0){this.post=false;var s="pIndex"+BX.UploaderUtils.getId();this.log("create new package for preview "+s);var i=new BX.UploaderPackage({id:s,data:e,post:this.preparePost({type:"brief"},true),uploadFileUrl:this.uploadFileUrl,limits:this.limits,params:this.params});i["SimpleUploaderUploadsPreview"]="Y";BX.addCustomEvent(i,"adjustProcess",BX.proxy(function(e,t,s,i,a){if(s==statuses.error){this.adjustProcess(e,t,s,i,a)}},this));BX.addCustomEvent(i,"startStream",BX.proxy(function(e,t,s){BX.onCustomEvent(this,"startPackagePreview",[e,t.id,s])},this));BX.addCustomEvent(i,"progressStream",BX.proxy(function(e,t,s){BX.onCustomEvent(this,"processPackagePreview",[e,t.id,s])},this));BX.addCustomEvent(i,"doneStream",BX.proxy(function(e,t,s){BX.onCustomEvent(this,"donePackagePreview",[e,t.id,s])},this));BX.addCustomEvent(i,"stopPackage",BX.proxy(function(e){},this));BX.addCustomEvent(i,"donePackage",BX.proxy(function(e,t,s){this.checkUploads(t.id);this.onFileNeedsPreviewCallback(t,s)},this));BX.addCustomEvent(i,"errorPackage",BX.proxy(function(e,t,i){BX.onCustomEvent(this,"error",[e,s,i]);BX.onCustomEvent(this,"onError",[e,s,i]);this.checkUploads(t.id)},this));BX.addCustomEvent(i,"processPackage",BX.proxy(function(e,t,s){BX.onCustomEvent(this,"processPackagePreview",[e,t,s])},this));BX.onCustomEvent(this,"onStartPreview",[s,i,this]);this.uploads.setItem(s,i);this.checkUploads()}};BX.Uploader.isSupported=function(){return window.Blob||window["MozBlobBuilder"]||window["WebKitBlobBuilder"]||window["BlobBuilder"]};var objName="BX.UploaderSimple";if(BX.Uploader.isSupported())objName="BX.Uploader";BX.Uploader.getInstanceName=function(){return objName};BX.Uploader.getInstance=function(params){BX.onCustomEvent(window,"onUploaderIsAlmostInited",[objName,params]);return eval("new "+objName+"(params);")};BX.UploaderPackage=function(e,t){this.filesCount=0;this.length=0;e=e||{};this["pIndex"]=this.id=e["id"];this.limits=e["limits"];this.params=e["params"];this.status=statuses.ready;if(e["data"]&&e.data.length>0){this.length=e.data.length;this.filesCount=e.data.length;this.uploadFileUrl=e["uploadFileUrl"];this.raw=e.data;this.repo=new BX.UploaderUtils.Hash;this.data=new BX.UploaderUtils.Hash;this.result=new BX.UploaderUtils.Hash;this.init();this.post=e["post"];if(!this.post){var s;while((s=this.raw.getFirst())&&s){this.adjustProcess(null,s,statuses.error,{error:BX.message("UPLOADER_UPLOADING_ERROR2")});this.raw.removeItem(s.id)}BX.onCustomEvent(this,"errorPackage",[null,this,null])}else{var i,a={packageIndex:this.id,filesCount:this.filesCount,mode:"upload"};for(i in a){if(a.hasOwnProperty(i)){this.post.data[this.params["uploadInputInfoName"]][i]=a[i];this.post.size+=BX.UploaderUtils.sizeof(i)+BX.UploaderUtils.sizeof(a[i])}}this.post.startSize=this.post.size;BX.onCustomEvent(this,"initializePackage",[this,this.data]);if(t)BX.onCustomEvent(t,"onPackageIsInitialized",[this,this.data]);this.log("initialize")}}this._exec=BX.delegate(this.exec,this)};BX.UploaderPackage.prototype={checkFile:function(e){var t="";if(e.file){if(this.limits["uploadMaxFilesize"]>0&&e.file.size>this.limits["uploadMaxFilesize"]){t=BX.message("FILE_BAD_SIZE")+" ("+BX.UploaderUtils.getFormattedSize(this.limits["uploadMaxFilesize"],2)+")"}else if(settings.maxSize!==null&&e.file.size>settings.maxSize){t=BX.message("UPLOADER_UPLOADING_ERROR6")}}return t},packStream:function(e){if(e.filesSize<=0)return null;var t=new BX.UploaderUtils.FormData,s,i=this.post.data,a=e.files,o;for(s in i){if(i.hasOwnProperty(s)){BX.UploaderUtils.appendToForm(t,s,i[s])}}for(var r in a){if(a.hasOwnProperty(r)){i=a[r];if(!!i.props){o=BX.UploaderUtils.prepareData(i.props);for(s in o){if(o.hasOwnProperty(s)){BX.UploaderUtils.appendToForm(t,this.params["uploadInputName"]+"["+r+"]["+s+"]",o[s])}}}if(!!i.files){for(var l=0;l<i.files.length;l++){s=i.files[l];s.copy=s.postName=s.thumb?s.thumb:"default";if(s.packages>0){s.postName+=".ch"+s.package+"."+(s.start>0?s.start:"0")+".chs"+s.packages}t.append(this.params["uploadInputName"]+"["+r+"]["+BX.UploaderUtils.prepareData(s.postName)+"]",s,BX.UploaderUtils.prepareData(s.postName))}}}}t.action=this.uploadFileUrl;return t},packFiles:function(e,t){if(!e)return statuses.error;else if(e["uploadStatus"]==statuses.done||e["uploadStatus"]==statuses.error)return e["uploadStatus"];var s=this.limits["phpMaxFileUploads"]-this.post.filesCount-(t.filesCount||0),i=this.limits["phpPostMaxSize"]-t.filesSize-t.postSize,a=this.limits["phpPostSize"]-t.filesSize,o,r,l={files:[]},n,p,u,h;while(i>0&&s>0&&a>0){r=null;o=null;p="";u=[];if(e.uploadStatus!=statuses.preparing){p=this.checkFile(e);if(p===""){l.props=e.getProps();if(e["restored"]){l.props["restored"]=e["restored"];delete e["restored"]}u.push(BX.proxy(function(){e.uploadStatus=statuses.preparing;this.adjustProcess(t.id,e,statuses["new"],{})},this))}else{l.props={name:e.name,error:true};this.adjustProcess(t.id,e,statuses.error,{error:p});e.uploadStatus=statuses.error}}if(e.uploadStatus==statuses.error){}else if(e.nonProcessRun===true){e.uploadStatus=statuses.done}else{if(!e["file"]){r=null}else if(e.file.uploadStatus!=statuses.done){r=e.file}else if(e["thumb"]&&e.thumb!==null){r=e.thumb}else{e.thumb=r=e.getThumbs(null)}var d=Object.prototype.toString.call(r);if(r===null){e.uploadStatus=statuses.done;this.adjustProcess(t.id,e,statuses.done,{});e.file.uploadStatus=statuses.done;e.thumb=null}else if(BX.type.isDomNode(r)){l.props=l.props||{name:e.name};l.files.push(r);u.push(BX.proxy(function(s){s.uploadStatus=statuses.done;if(e.file==s){this.adjustProcess(t.id,e,statuses.preparing,{canvas:"default",package:1,packages:1})}else{this.adjustProcess(t.id,e,statuses.preparing,{canvas:e.thumb.thumb,package:1,packages:1});e.thumb=null}},this))}else if(!(d=="[object File]"||d=="[object Blob]")){l.props=l.props||{name:e.name};l.props["files"]=l.props["files"]||{};l.props["files"][r["thumb"]||"default"]=r;u.push(BX.proxy(function(s){s.uploadStatus=statuses.done;if(e.file==s){this.adjustProcess(t.id,e,statuses.preparing,{canvas:"default",package:1,packages:1})}else{this.adjustProcess(t.id,e,statuses.preparing,{canvas:e.thumb.thumb,package:1,packages:1});e.thumb=null}},this))}else{o=BX.UploaderUtils.getFilePart(r,i-BX.UploaderUtils.sizeof({name:e.name}),this.limits["phpUploadMaxFilesize"]);if(!o){l.props="error";this.adjustProcess(t.id,e,statuses.error,{error:BX.message("FILE_BAD_SIZE")});e.uploadStatus=statuses.error}else{l.files.push(o);l.props=l.props||{name:e.name};u.push(BX.proxy(function(s,i){BX.UploaderUtils.applyFilePart(s,i);if(e.file==s&&i==s){this.adjustProcess(t.id,e,statuses.preparing,{canvas:"default",package:1,packages:1})}else if(e.file==s){this.adjustProcess(t.id,e,statuses.preparing,{canvas:"default",package:i.package+1,packages:i.packages,blob:i})}else if(i==s){this.adjustProcess(t.id,e,statuses.preparing,{canvas:e.thumb.thumb,package:1,packages:1,blob:i});e.thumb=null}else{this.adjustProcess(t.id,e,statuses.preparing,{canvas:e.thumb.thumb,package:i.package+1,packages:i.packages,blob:i});if(e.thumb.uploadStatus==statuses.done)e.thumb=null}},this))}}}if(l.files.length>0||l["props"]){n=BX.UploaderUtils.sizeof(l.files)+(l["props"]?BX.UploaderUtils.sizeof(l.props):0);i-=n;a-=n;if(i>=0&&a>0){while((h=u.shift())&&h)h(r,o,p);t.filesSize+=n;t.files[e.id]=BX.UploaderUtils.makeAnArray(t.files[e.id],l);if(l.files.length){s--;t.filesCount++}}else if(t.filesCount<=0){this.adjustProcess(t.id,e,statuses.error,{error:BX.message("UPLOADER_UPLOADING_ERROR4")});e.uploadStatus=statuses.error}l={files:[]}}if(e.uploadStatus!==statuses.preparing){break}}return e.uploadStatus},start:function(e){this.streams=e;if(this.status!=statuses.ready)return;this.status=statuses.inprogress;this.__onAllStreamsAreKilled=BX.delegate(function(e,t){this.stop();BX.onCustomEvent(this,"donePackage",[t,this,this["lastResponse"]])},this);BX.addCustomEvent(this.streams,"onrelease",this.__onAllStreamsAreKilled);BX.onCustomEvent(this,"startPackage",[this,e]);this.log("start");e.init(this,this._exec)},stop:function(){this.status=statuses.stopped;this.streams.stop();BX.onCustomEvent(this,"stopPackage",[this,this.repo]);BX.removeCustomEvent(this.streams,"onrelease",this.__onAllStreamsAreKilled);this.log("stop")},log:function(){BX.UploaderUtils.log("package",this.id,arguments)},init:function(){var e,t=BX.proxy(function(e,t){if(this.raw.removeItem(e)){this.data.setItem(e,t);this.repo.setItem(e,t);BX.onCustomEvent(t,"onFileHasToBePrepared",[t.id,t]);this.init()}},this);while((e=this.raw.getFirst())&&e){BX.addCustomEvent(e,"onFileIsDeleted",BX.delegate(function(e){this.length--;this.filesCount--;if(this.data.removeItem(e.id))this.post.data[this.params["uploadInputInfoName"]]["filesCount"]=this.filesCount;this.result.removeItem(e.id);this.repo.removeItem(e.id)},this));if(e.status===statuses["new"]){BX.addCustomEvent(e,"onFileIsInited",t);break}else{t(e.id,e)}}},exec:function(e,t){if(this.status!==statuses.inprogress)return;this.log("exec");var s,i=false;if(e.pack!=this){this.log("stream is bound: "+e.id);BX.addCustomEvent(e,"onsuccess",BX.delegate(this.doneStream,this));BX.addCustomEvent(e,"onfailure",BX.delegate(this.errorStream,this));BX.addCustomEvent(e,"onprogress",BX.delegate(this.progressStream,this))}if(t!==false){this.log("stream is reinited: "+e.id);e.init(this)}var a,o=e.filesCount;if(this.filesCount>0){while((s=this.data.getFirst())&&s){if(s.uploadStatus==statuses.done){}else if(s.preparationStatus!=statuses.done){i=true;break}a=this.packFiles(s,e);if(typeof a=="undefined"){break}else if(a!=statuses.error){o++;if(a==statuses.preparing){break}}this.data.removeItem(s.id);if(this["SimpleUploaderUploadsPreview"]=="Y"){delete s.uploadStatus}}if(i===true||!s&&this.raw.length>0){setTimeout(BX.proxy(function(){this.exec(e,false)},this),100);return}}var r=o>0?this.packStream(e):null;if(r!==null){this.log("stream is packed: "+e.id);this.startStreaming(e);e.send(r);this.sended=true}else{this.log("stream is killed: "+e.id);e.kill()}},adjustProcess:function(e,t,s,i){if(t&&this.repo.hasItem(t.id)){if(s==statuses.error||s==statuses.uploaded){this.data.removeItem(t.id);this.result.setItem(t.id,t)}BX.onCustomEvent(this,"adjustProcess",[e,t,s,i,this.id,this])}},adjustPostSize:function(e,t){var s=false,i=null;var a=e.xhr.finishTime-e.xhr.startTime;if(t!==false){i=Math.ceil(a>0?(e.postSize+e.filesSize)*1e3/a*settings.estimatedTimeForUploadFile:0);if(i>this.limits["phpPostSize"]){i=Math.min(this.limits["phpPostSize"]*2,i,this.limits["phpPostMaxSize"])}}else if(this.limits["phpPostSize"]>settings.phpPostMinSize){i=Math.ceil(this.limits["phpPostSize"]/2)}if(i>0&&i!==this.limits["phpPostSize"]){this.limits["phpPostSize"]=Math.max(i,settings.phpPostMinSize);s=true}return s},startStreaming:function(e){this.log("start streaming");for(var t in e.files){if(e.files.hasOwnProperty(t)){this.adjustProcess(e.id,this.repo.getItem(t),statuses.inprogress,0)}}BX.onCustomEvent(this,"startStream",[e,this.id,e.files])},doneStream:function(e,t){this.adjustPostSize(e,true);var s=function(e,t){for(var i in t){if(t.hasOwnProperty(i)&&!e[i]){e[i]=t[i]}else if(typeof t[i]==typeof e[i]=="object"&&t[i]!==null&&e[i]!==null){e[i]=s(e[i],t[i])}}return e};this.response=s(this.response||{},t||{});var i=this.streams.getUploader();var a,o,r,l,n,p,u;for(o in e.files){if(e.files.hasOwnProperty(o)){a=this.repo.getItem(o);r=t.files[o];if(a){if(!r){i.queue.restoreFiles(new BX.UploaderUtils.Hash([a]),false,true);delete a.uploadStatus;this.data.setItem(a.id,a)}else if(!r["status"]){if(BX.type.isArray(e.files[o]["files"])){u={};for(p=0;p<e.files[o]["files"].length;p++){r=e.files[o]["files"][p];if(u[r["copy"]])continue;u[r["copy"]]="Y";if(r["copy"]=="default"&&r["package"]<=0){i.queue.restoreFiles(new BX.UploaderUtils.Hash([a]));delete a.uploadStatus;this.data.setItem(a.id,a);break}if(r["copy"]=="default"){a.uploadStatus=statuses.preparing;a.file["uploadStatus"]=statuses.preparing;a.file["package"]=r["package"]}if(a.file["copies"]){a.file["copies"].reset();var h;while((h=a.file["copies"].getNext())&&h){delete h["uploadStatus"];delete h["firstChunk"];delete h["package"];delete h["packages"]}a.file["copies"].reset()}}}}else if(r.status=="error"){this.adjustProcess(e.id,a,statuses.error,r)}else if((a.hash=r.hash)&&r.status=="uploaded"){if(settings.maxSize!==null)settings.maxSize-=a.file.size;this.adjustProcess(e.id,a,statuses.uploaded,r)}else{this.adjustProcess(e.id,a,statuses.inprogress,r);l=false;n=r["file"]&&r["file"]["files"]?r["file"]["files"]:false;if(typeof n=="object"){for(p in n){if(n.hasOwnProperty(p)){if(n[p]["chunksInfo"]&&n[p]["chunksInfo"]["count"]==n[p]["chunksInfo"]["uploaded"]&&n[p]["chunksInfo"]["count"]>n[p]["chunksInfo"]["written"]){l=true;break}}}a.nonProcessRun=l;if(l==true){if(!a["nonProcessRunLastTimeWritten"]||a["nonProcessRunLastTimeWritten"]!=n[p]["chunksInfo"]["written"]){a["nonProcessRunLastTimeWritten"]=n[p]["chunksInfo"]["written"];a["nonProcessRunLastTimeWrittenCount"]=0}else{a["nonProcessRunLastTimeWrittenCount"]++}if(a["nonProcessRunLastTimeWrittenCount"]<=10){delete a.uploadStatus;this.data.setItem(a.id,a)}else{this.adjustProcess(e.id,a,statuses.error,{error:BX.message("UPLOADER_UPLOADING_ERROR3")})}}}}}}}this.log("stream is done: "+e.id,t["status"],this.response);this["lastResponse"]=t;if(t["status"]=="inprogress"){BX.onCustomEvent(this,"continuePackage",[e,this,t])}else{if(t["status"]=="error")this.errorStream(e,t);else{this.stop();BX.onCustomEvent(this,"donePackage",[e,this,t])}}},errorStream:function(e,t){var s,i,a,o;this.log("error stream: "+e.id,"status: ",e.xhr.status,t);if(e&&t=="timeout"&&this.adjustPostSize(e,false)&&e["files"]){for(a in e["files"]){if(e["files"].hasOwnProperty(a)){if(this.repo.hasItem(a)&&BX.type.isArray(e["files"][a]["files"])&&e["files"][a]["files"].length>0){s=this.repo.getItem(a);if(e["files"][a]["files"][0]["package"]<=0||s["uploadStatus"]!==statuses.inprogress){delete s["uploadStatus"];delete s.file["uploadStatus"];delete s.file["firstChunk"];delete s.file["package"];delete s.file["packages"]}else{s.file["package"]=Math.min(e["files"][a]["files"][0]["package"],s.file["package"])}if(s.file["copies"]){s.file["copies"].reset();while((o=s.file["copies"].getNext())&&o){delete o["uploadStatus"];delete o["firstChunk"];delete o["package"];delete o["packages"]}s.file["copies"].reset()}if(!this.data.hasItem(a)){this.result.removeItem(a);this.data.unshiftItem(a,s)}}}}BX.onCustomEvent(this,"resendPackage",[e,this,t])}else{this.stop();var r=t=="timeout"?BX.message("UPLOADER_UPLOADING_ERROR5"):BX.message("UPLOADER_UPLOADING_ERROR1");t=t||{};t["files"]=t["files"]?t["files"]:{};if((s=this.repo.getFirst())&&s){do{if(!this.result.hasItem(s.id)){if(t.files&&t.files[s.id])i=t.files[s.id];else if(BX.type.isNotEmptyString(t["error"]))i=t;else if(BX.type.isArray(t["errors"])){i={error:""};for(var l=0;l<t["errors"].length;l++){i.error+=BX.type.isPlainObject(t["errors"][l])&&t["errors"][l]["message"]?t["errors"][l]["message"]:t["errors"][l]}}else i={error:r};this.adjustProcess(e.id,s,statuses.error,i)}}while((s=this.repo.getNext())&&s)}BX.onCustomEvent(this,"errorPackage",[e,this,t])}},progressStream:function(e,t){var s;e.files=e.files||{};for(s in e.files){if(e.files.hasOwnProperty(s)){this.adjustProcess(e.id,this.repo.getItem(s),statuses.inprogress,t)}}BX.onCustomEvent(this,"processPackage",[e,this,t])}};BX.UploaderStream=function(e,t){this.id="stream"+e;this._id=e;this.manager=t;this._onsuccess=BX.delegate(this.onsuccess,this);this._onfailure=BX.delegate(this.onfailure,this);this._onerror=BX.delegate(this.onerror,this);this._onprogress=BX.delegate(this.onprogress,this)};BX.UploaderStream.prototype={xhr:{},init:function(e){this["pIndex"]=e.id;this.pack=e;this.files={};this.filesCount=0;this.filesSize=0;this.postSize=e.post.size},send:function(e){if(e&&e.local===true){BX.adjust(e.form,{attrs:{action:e.action}});BX.ajax.submit(e.form,BX.proxy(function(e){e=BX.util.htmlspecialcharsback(e);while(/^<(.*?)>(.*?)<(.*?)>$/gi.test(e))e=e.replace(/^<(.*?)>(.*?)<(.*?)>$/gi,"$2");while(/^<([^<>]+)>(.*?)/gi.test(e))e=e.replace(/^<(.*?)>(.*?)/gi,"$2");while(/(.+?)<([^<>]+)>$/gi.test(e))e=e.replace(/(.+?)<([^<>]+)>$/gi,"$1");var t=BX.parseJSON(e,{});if(!!t){this.onsuccess(t)}else{this.onfailure("processing",e)}},this));this.onprogress(90)}else if(e){this.xhr=BX.ajax({method:"POST",dataType:"json",data:e,url:e.action,onsuccess:this._onsuccess,onfailure:this._onfailure,onerror:this._onerror,start:false,preparePost:false,processData:true,skipAuthCheck:true,timeout:settings.maxTimeForUploadFile});this.xhr.upload.addEventListener("progress",this._onprogress,false);var t=new Date;this.xhr.startTime=t.getTime();this.xhr.send(e)}else{this.onfailure("empty",null)}},onsuccess:function(e){var t=new Date;this.xhr.finishTime=t.getTime();try{if(typeof e=="object"&&e&&e["files"]&&e["status"]!=="error")BX.onCustomEvent(this,"onsuccess",[this,e]);else BX.onCustomEvent(this,"onfailure",[this,e])}catch(e){BX.debug(e)}BX.onCustomEvent(this,"onrelease",[this])},onfailure:function(e,t){var s=new Date,i=t&&t["data"]?BX.parseJSON(t["data"],{}):"";if(BX.message("bxUploaderLog")==="Y"&&e==="processing"){BX.ajax.post("/bitrix/tools/upload.php?action=error",{sessid:BX.bitrix_sessid(),path:window.location.pathname,data:t["data"]})}this.xhr.finishTime=s.getTime();BX.onCustomEvent(this,"onfailure",[this,i]);BX.onCustomEvent(this,"onrelease",[this])},onerror:function(){var e=new Date;this.xhr.finishTime=e.getTime();this.onfailure.apply(arguments)},onprogress:function(e){var t=15;if(typeof e=="object"&&e.lengthComputable){t=e.loaded*100/(e["total"]||e["totalSize"])}else if(e>t)t=e;t=t>5?t:5;BX.onCustomEvent(this,"onprogress",[this,t]);return t},kill:function(){BX.DoNothing();BX.onCustomEvent(this,"onkill",[this])},restore:function(){this.manager.restore(this)}};BX.UploaderStreams=function(e,t){this.streams=new BX.UploaderUtils.Hash;this.killedStreams=new BX.UploaderUtils.Hash;this.packages=new BX.UploaderUtils.Hash;this.uploaded=t;this.timeout=3e3;this._exec=BX.delegate(this.exec,this);this._restore=BX.delegate(this.restore,this);this._kill=BX.delegate(this.kill,this);this.count=Math.min(5,e>1?e:1);this.status=statuses.ready};BX.UploaderStreams.prototype={init:function(e,t){if(this.package!==e){this.package=e;this.package.log("streams are occupied",t);this.packages.setItem(e.id,e.post);this.handler=t;var s=this.count,i;while((i=this.streams.getFirst())&&i){this.streams.removeItem(i.id);i=null}this.streams=new BX.UploaderUtils.Hash;while(s-- >0){i=new BX.UploaderStream(s,this);BX.addCustomEvent(i,"onrelease",this._restore);BX.addCustomEvent(i,"onkill",this._kill);this.streams.setItem(i.id,i)}}this.start()},getUploader:function(){return this.uploaded},exec:function(){if(this.status==statuses.ready){this.package.log("streams are in executing");var e=this.streams.getFirst();if(e){this.streams.removeItem(e.id);if(this.streams.length>0){setTimeout(this._exec,this.timeout)}this.handler(e)}}else{this.package.log("streams are locked")}},restore:function(e){this.streams.setItem(e.id,e);BX.defer_proxy(this.exec,this)()},kill:function(e){this.killedStreams.setItem(e.id,e);if(this.killedStreams.length==this.count){BX.onCustomEvent(this,"onrelease",[this,e])}},start:function(){this.status=statuses.ready;this.exec()},stop:function(){this.status=statuses.stopped}};BX.Uploader.getVersion=function(){return"1"}})(window);
/* End */
;
; /* Start:"a:4:{s:4:"full";s:58:"/bitrix/js/main/core/core_uploader/file.js?154168962338322";s:6:"source";s:42:"/bitrix/js/main/core/core_uploader/file.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
;(function(window){
	if (window.BX["UploaderFile"])
		return false;
	var getOrientation = (function(){
		var exif = {
			tags : {
				// 0x0100 : "ImageWidth",
				// 0x0101 : "ImageHeight",
				// 0x8769 : "ExifIFDPointer",
				// 0x8825 : "GPSInfoIFDPointer",
				// 0xA005 : "InteroperabilityIFDPointer",
				// 0x0102 : "BitsPerSample",
				// 0x0103 : "Compression",
				// 0x0106 : "PhotometricInterpretation",
				0x0112 : "Orientation",
				// 0x0115 : "SamplesPerPixel",
				// 0x011C : "PlanarConfiguration",
				// 0x0212 : "YCbCrSubSampling",
				// 0x0213 : "YCbCrPositioning",
				// 0x011A : "XResolution",
				// 0x011B : "YResolution",
				// 0x0128 : "ResolutionUnit",
				// 0x0111 : "StripOffsets",
				// 0x0116 : "RowsPerStrip",
				// 0x0117 : "StripByteCounts",
				// 0x0201 : "JPEGInterchangeFormat",
				// 0x0202 : "JPEGInterchangeFormatLength",
				// 0x012D : "TransferFunction",
				// 0x013E : "WhitePoint",
				// 0x013F : "PrimaryChromaticities",
				// 0x0211 : "YCbCrCoefficients",
				// 0x0214 : "ReferenceBlackWhite",
				// 0x0132 : "DateTime",
				// 0x010E : "ImageDescription",
				// 0x010F : "Make",
				// 0x0110 : "Model",
				// 0x0131 : "Software",
				// 0x013B : "Artist",
				// 0x8298 : "Copyright"
			},
			getStringFromDB : function (buffer, start, length) {
				var outstr = "", n;
				for (n = start; n < start+length; n++) {
					outstr += String.fromCharCode(buffer.getUint8(n));
				}
				return outstr;
			},
			readTags : function(file, tiffStart, dirStart, strings, bigEnd) {
				var entries = file.getUint16(dirStart, !bigEnd),
					tags = {},
					entryOffset, tag,
					i,
					l = 0;
				for (i in strings)
				{
					if (strings.hasOwnProperty(i))
						l++;
				}

				for (i = 0; i < entries; i++)
				{
					entryOffset = dirStart + i*12 + 2;
					tag = strings[file.getUint16(entryOffset, !bigEnd)];
					tags[tag] = exif.readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd);
					l--;
					if (l <= 0)
						break;
				}
				return tags;
			},
			readTagValue : function(file, entryOffset, tiffStart, dirStart, bigEnd) {
				var type = file.getUint16(entryOffset+2, !bigEnd),
					numValues = file.getUint32(entryOffset+4, !bigEnd),
					valueOffset = file.getUint32(entryOffset+8, !bigEnd) + tiffStart,
					offset,
					vals, val, n,
					numerator, denominator;

				switch (type)
				{
					case 1: // byte, 8-bit unsigned int
					case 7: // undefined, 8-bit byte, value depending on field
						if (numValues == 1) {
							return file.getUint8(entryOffset + 8, !bigEnd);
						} else {
							offset = numValues > 4 ? valueOffset : (entryOffset + 8);
							vals = [];
							for (n=0;n<numValues;n++) {
								vals[n] = file.getUint8(offset + n);
							}
							return vals;
						}
					case 2: // ascii, 8-bit byte
						offset = numValues > 4 ? valueOffset : (entryOffset + 8);
						return exif.getStringFromDB(file, offset, numValues-1);
					case 3: // short, 16 bit int
						if (numValues == 1) {
							return file.getUint16(entryOffset + 8, !bigEnd);
						} else {
							offset = numValues > 2 ? valueOffset : (entryOffset + 8);
							vals = [];
							for (n=0;n<numValues;n++) {
								vals[n] = file.getUint16(offset + 2*n, !bigEnd);
							}
							return vals;
						}
					case 4: // long, 32 bit int
						if (numValues == 1) {
							return file.getUint32(entryOffset + 8, !bigEnd);
						} else {
							vals = [];
							for (n=0;n<numValues;n++) {
								vals[n] = file.getUint32(valueOffset + 4*n, !bigEnd);
							}
							return vals;
						}
					case 5:    // rational = two long values, first is numerator, second is denominator
						if (numValues == 1) {
							numerator = file.getUint32(valueOffset, !bigEnd);
							denominator = file.getUint32(valueOffset+4, !bigEnd);
							val = new Number(numerator / denominator);
							val.numerator = numerator;
							val.denominator = denominator;
							return val;
						} else {
							vals = [];
							for (n=0;n<numValues;n++) {
								numerator = file.getUint32(valueOffset + 8*n, !bigEnd);
								denominator = file.getUint32(valueOffset+4 + 8*n, !bigEnd);
								vals[n] = new Number(numerator / denominator);
								vals[n].numerator = numerator;
								vals[n].denominator = denominator;
							}
							return vals;
						}
					case 9: // slong, 32 bit signed int
						if (numValues == 1) {
							return file.getInt32(entryOffset + 8, !bigEnd);
						} else {
							vals = [];
							for (n=0;n<numValues;n++) {
								vals[n] = file.getInt32(valueOffset + 4*n, !bigEnd);
							}
							return vals;
						}
					case 10: // signed rational, two slongs, first is numerator, second is denominator
						if (numValues == 1) {
							return file.getInt32(valueOffset, !bigEnd) / file.getInt32(valueOffset+4, !bigEnd);
						} else {
							vals = [];
							for (n=0;n<numValues;n++) {
								vals[n] = file.getInt32(valueOffset + 8*n, !bigEnd) / file.getInt32(valueOffset+4 + 8*n, !bigEnd);
							}
							return vals;
						}
				}
			},
			readData : function (file, start) {
				if (exif.getStringFromDB(file, start, 4) != "Exif")
				{
					return false;
				}

				var bigEnd,
					tiffOffset = start + 6;

				// test for TIFF validity and endianness
				if (file.getUint16(tiffOffset) == 0x4949)
				{
					bigEnd = false;
				}
				else if (file.getUint16(tiffOffset) == 0x4D4D)
				{
					bigEnd = true;
				}
				else
				{
					return false;
				}

				if (file.getUint16(tiffOffset+2, !bigEnd) != 0x002A)
				{
					return false;
				}

				var firstIFDOffset = file.getUint32(tiffOffset + 4, !bigEnd);

				if (firstIFDOffset < 0x00000008)
				{
					return false;
				}

				return exif.readTags(file, tiffOffset, tiffOffset + firstIFDOffset, exif.tags, bigEnd);
			},
			readBase64 : function (base64)
			{
				base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
				var binary_string =  window.atob(base64), //decode base64
					len = binary_string.length,
					bytes = new Uint8Array(len);
				for (var i = 0; i < len; i++) {
					bytes[i] = binary_string.charCodeAt(i);
				}
				var dataView = new DataView(bytes.buffer);
				if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8))
				{
					return false; // not a valid jpeg
				}

				var offset = 2,
					length = bytes.buffer.byteLength,
					marker,
					result = false;
				while (offset < length)
				{
					if (dataView.getUint8(offset) != 0xFF) {
						break; // not a valid marker, something is wrong
					}

					marker = dataView.getUint8(offset + 1);

					// we could implement handling for other markers here,
					// but we're only looking for 0xFFE1 for EXIF data

					if (marker == 225)
					{
						result = exif.readData(dataView, offset + 4, dataView.getUint16(offset + 2) - 2);
						break;
					}
					else
					{
						offset += 2 + dataView.getUint16(offset+2);
					}
				}
				return result;
			}
		};
		return function(base64){
			if (BX.type.isString(base64))
			{
				try {
					var tags = exif.readBase64(base64);
					if(tags && tags["Orientation"])
						return tags["Orientation"];
				}
				catch (e)
				{
				}
			}
			return false;
		};
	})(),
		setOrientation = function(image, cnv, ctx, exifOrientation) {
			var width = image.width,
				height = image.height;
			if ([5,6,7,8].indexOf(exifOrientation) >= 0)
			{
				width = image.height;
				height = image.width;
			}

			BX.adjust(cnv, {props: {width: width, height: height}});

			ctx.save();
			switch(exifOrientation) {
				case 2:
					// $img.addClass('flip');
					ctx.scale(-1, 1);
					ctx.translate(-cnv.width, 0);
					break;
				case 3:
					// $img.addClass('rotate-180');
					ctx.translate(cnv.width, cnv.height);
					ctx.rotate(Math.PI);
					break;
				case 4:
					// $img.addClass('flip-and-rotate-180');
					ctx.scale(-1, 1);
					ctx.translate(0, cnv.height);
					ctx.rotate(Math.PI);
					break;
				case 5:
					// $img.addClass('flip-and-rotate-90');
					ctx.scale(-1, 1);
					ctx.translate(0, 0);
					ctx.rotate(Math.PI / 2);
					break;
				case 6:
					// $img.addClass('rotate-90');
					ctx.translate(cnv.width, 0);
					ctx.rotate(Math.PI / 2);
					break;
				case 7:
					// $img.addClass('flip-and-rotate-90');
					ctx.scale(-1, 1);
					ctx.translate(-cnv.width, cnv.height);
					ctx.rotate(Math.PI * 3 / 2);
					break;
				case 8:
					// $img.addClass('rotate-270');
					ctx.translate(0, cnv.height);
					ctx.rotate(Math.PI * 3 / 2);
					break;
			}
			ctx.drawImage(image, 0, 0);
			ctx.restore();
		};
	var BX = window.BX,
		statuses = { "new" : 0, ready : 1, preparing : 2, inprogress : 3, done : 4, failed : 5, stopped : 6, changed : 7, uploaded : 8},
		cnvConstr = (function(){
			var cnvConstructor = function(timelimit) {
				this.timeLimit = (typeof timelimit === "number" && timelimit > 0 ? timelimit : 50);
				this.status = statuses.ready;
				this.queue = new BX.UploaderUtils.Hash();
				this.id = (new Date()).getTime();
			};
			cnvConstructor.prototype = {
				counter : 0,
				active : null,
				image : null,
				getImage : function() {
					if (!this.image)
						this.image = new Image();
					return this.image;
				},
				canvas : null,
				getCanvas : function() {
					if (!this.canvas)
					{
						this.canvas = BX.create('CANVAS', {style : {display: "none"}});
						document.body.appendChild(this.canvas);
					}

					return this.canvas;
				},
				context : null,
				getContext : function() {
					if (!this.context && this.getCanvas()["getContext"])
						this.context = this.getCanvas().getContext('2d');
					return this.context;
				},
				reader : null,
				getReader : function() {
					if (!this.reader && window["FileReader"])
						this.reader = new FileReader();
					return this.reader;
				},
				load : function(file, callback, id, callbackFail) {
					if (this.active !== null || (this.getReader() && this.getReader().readyState == 1))
						return;

					this.counter++;
					this.active = file;
					var image = this.getImage();
					BX.unbindAll(image);
					image.onload = function(){};
					image.onerror = function(){};

					/* Almost all browsers cache images from local resource except of FF on 06.03.2017. It appears that
					FF collect src and does not abort image uploading when src is changed. And we had a bug when in
					onload event we got e.target.src of one element but source of image was from '/bitrix/images/1.gif'. */
					// TODO check if chrome and other browsers cache local files for now. If it does not then delete next 2 strings
					if (!BX.browser.IsFirefox())
						image.src = '/bitrix/images/1.gif';

					/** For Garbage collector */
					this.onload = null;
					delete this.onload;
					this.onerror = null;
					delete this.onerror;

					this.onload = BX.delegate(function(e){
						if (e && e.target && e.target.src && e.target.src.substr(-20) == "/bitrix/images/1.gif")
							return;
						if (!!callback)
						{
							try {
								callback(BX.proxy_context, this.getCanvas(), this.getContext(), getOrientation((((e && e.target && e.target.src) ? e.target.src : (BX.proxy_context || null)))));
							}
							catch (e)
							{
								BX.debug(e);
							}
						}
						if (!!id)
						{
							this.queue.removeItem(id);
							setTimeout(BX.proxy(function() {
								this.active = null;
								this.exec();
							}, this), this.timeLimit);
						}
						else
							this.active = null;
					}, this);
					this.onerror = BX.delegate(function(){
						if (!!callbackFail)
						{
							try
							{
								callbackFail(BX.proxy_context);
							}
							catch (e)
							{
								BX.debug(e);
							}
						}
						if (!!id)
						{
							this.queue.removeItem(id);
							setTimeout(BX.proxy(function() {
								this.active = null;
								this.exec();
							}, this), this.timeLimit);
						}
						else
							this.active = null;
					}, this);

					image.name = file.name;

					image.onload = this.onload;
					image.onerror = this.onerror;

					var res = Object.prototype.toString.call(file);
					if (file["tmp_url"])
					{
						image.src = file["tmp_url"] + (file["tmp_url"].indexOf("?") > 0 ? '&' : '?') + 'imageUploader' + this.id + this.counter;
					}
					else if (res !== '[object File]' && res !== '[object Blob]')
					{
						this.onerror(null);
					}
					else if (window["URL"])
					{
						image.src = window["URL"]["createObjectURL"](file);
					}
					else if (this.getReader() !== null)
					{
						this.__readerOnLoad = null;
						delete this.__readerOnLoad;
						this.__readerOnLoad = BX.delegate(function(e) {
							this.__readerOnLoad = null;
							delete this.__readerOnLoad;
							image.src = e.target.result;
						}, this);
						this.getReader().onloadend = this.__readerOnLoad;
						this.getReader().onerror = BX.proxy(function(e) { this.onerror(null); }, this);
						this.getReader().readAsDataURL(file);
					}
				},
				push : function(file, callback, failCallback) {
					var id = BX.UploaderUtils.getId();
					this.queue.setItem(id, [id, file, callback, failCallback]);
					this.exec();
				},
				exec : function() {
					var item = this.queue.getFirst();
					if (!!item)
						this.load(item[1], item[2], item[0], item[3]);
				},
				pack : function(fileType) {
					return  BX.UploaderUtils.dataURLToBlob(this.getCanvas().toDataURL(fileType));
				}
			};
			return cnvConstructor;
		})();
	BX.UploaderFileCnvConstr = cnvConstr;
	BX.UploaderFileFileLoader = (function(){
		var d = function(timelimit) {
			this.timeLimit = (typeof timelimit === "number" && timelimit > 0 ? timelimit : 50);
			this.status = statuses.ready;
			this.queue = new BX.UploaderUtils.Hash();
			this._exec = BX.delegate(this.exec, this);
		};
		d.prototype = {
			xhr : null,
			goToNext : function(id)
			{
				delete this.xhr;
				this.xhr = null;
				this.queue.removeItem(id);
				this.status = statuses.ready;
				setTimeout(this._exec, this.timeLimit);
			},
			load : function(id, path, onsuccess, onfailure)
			{
				if (this.status != statuses.ready)
					return;
				this.status = statuses.inprogress;
				var _this = this;
				this.xhr = BX.ajax({
					'method': 'GET',
					'data' : '',
					'url': path,
					'onsuccess': function(blob){if (blob === null){onfailure(blob);} else {onsuccess(blob);} _this.goToNext(id);},
					'onfailure': function(blob){onfailure(blob); _this.goToNext(id);},
					'start': false,
					'preparePost':false,
					'processData':false
				});
				this.xhr.withCredentials = true;
				this.xhr.responseType = 'blob';

				this.xhr.send();
			},
			push : function(path, onsuccess, onfailure)
			{
				var id = BX.UploaderUtils.getId();
				this.queue.setItem(id, [id, path, onsuccess, onfailure]);
				this.exec();
			},
			exec : function()
			{
				var item = this.queue.getFirst();
				if (!!item)
					this.load(item[0], item[1], item[2], item[3]);
			}
		};
		return d;
	})();
	var prvw = new cnvConstr(), upld = new cnvConstr(), edtr = new cnvConstr(), canvas = BX.create('CANVAS'), ctx;
	/**
	 * @return {BX.UploaderFile}
	 * @file file
	 * @params array
	 * @limits array
	 * @caller {BX.Uploader}
	 * You should work with params["fields"] in case you want to change visual part
	 */
var mobileNames = {};
	BX.UploaderFile = function (file, params, limits, caller)
	{
		this.dialogName = (this.dialogName ? this.dialogName : "BX.UploaderFile");
		this.file = file;
		this.id = (file['id'] || 'file' + BX.UploaderUtils.getId());
		this.name = file.name;
		this.isNode = false;
		if (BX.type.isDomNode(file))
		{
			this.isNode = true;
			this.name = BX.UploaderUtils.getFileNameOnly(file.value);
			if (/\[(.+?)\]/.test(file.name))
			{
				var tmp = /\[(.+?)\]/.exec(file.name);
				this.id = tmp[1];
			}
			this.file.bxuHandler = this;
		}
		else if (file["tmp_url"] && !file["name"])
		{
			this.name = BX.UploaderUtils.getFileNameOnly(file["tmp_url"]);
		}
		this.preview = '<span id="' + this.id + 'Canvas" class="bx-bxu-canvas"></span>';
		this.nameWithoutExt = (this.name.lastIndexOf('.') > 0 ? this.name.substr(0, this.name.lastIndexOf('.')) : this.name);
		this.ext = this.name.substr(this.nameWithoutExt.length + 1);

		if (/iPhone|iPad|iPod/i.test(navigator.userAgent) && this.nameWithoutExt == "image")
		{
			var nameWithoutExt = 'mobile_' + BX.date.format("Ymd_His");
			mobileNames[nameWithoutExt] = (mobileNames[nameWithoutExt] || 0);
			this.nameWithoutExt = nameWithoutExt + (mobileNames[nameWithoutExt] > 0 ? ("_" + mobileNames[nameWithoutExt]) : "");
			this.name = this.nameWithoutExt + (BX.type.isNotEmptyString(this.ext) ? ("." + this.ext) : "");
			mobileNames[nameWithoutExt]++;
		}

		this.size = '';
		if (file.size)
			this.size = BX.UploaderUtils.getFormattedSize(file.size, 0);
		this.type = file.type;
		this.status = statuses["new"];
		this.limits = limits;
		this.caller = caller;
		this.fields = {
			thumb : {
				tagName : 'SPAN',
				template : '<div class="someclass">#preview#<div>#name#</div>',
				editorTemplate : '<div class="someeditorclass"><div>#name#</div>',
				className : "bx-bxu-thumb-thumb",
				placeHolder : null
			},
			preview : {
				params : { width : 400, height : 400 },
				template : "#preview#",
				editorParams : { width : 1024, height : 860 },
				editorTemplate : '<span>#preview#</span>',
				className : "bx-bxu-thumb-preview",
				placeHolder : null,
				events : {
					click : BX.delegate(this.clickFile, this)
				},
				type : "html"
			},
			name : {
				template : "#name#",
				editorTemplate : '<span><input type="text" name="name" value="#name#" /></span>',
				className : "bx-bxu-thumb-name",
				placeHolder : null
			},
			type : {
				template : "#type#",
				editorTemplate : '#type#',
				className : "bx-bxu-thumb-type",
				placeHolder : null
			}
		};

		if (!!params["fields"])
		{
			var ij, key;
			for (var ii in params["fields"])
			{
				if (params["fields"].hasOwnProperty(ii))
				{
					if (!!this.fields[ii])
					{
						for (ij in params["fields"][ii])
						{
							if (params["fields"][ii].hasOwnProperty(ij))
							{
								this.fields[ii][ij] = params["fields"][ii][ij];
							}
						}
					}
					else
						this.fields[ii] = params["fields"][ii];
					key = ii + '';
					if (key.toLowerCase() != "thumb" && key.toLowerCase() != "preview")
					{
						this[key.toLowerCase()] = (!!params["fields"][ii]["value"] ? params["fields"][ii]["value"] : "");
						this.log(key.toLowerCase() + ': ' + this[key.toLowerCase()]);
					}
				}
			}
		}

		BX.onCustomEvent(this, "onFileIsCreated", [this.id, this, this.caller]);
		BX.onCustomEvent(this.caller, "onFileIsCreated", [this.id, this, this.caller]);

		this.makePreview();
		this.preparationStatus = statuses.done;
		return this;
	};
	BX.UploaderFile.prototype = {
		log : function(text)
		{
			BX.UploaderUtils.log('file ' + this.name, text);
		},
		makeThumb : function()
		{
			var template = this.fields.thumb.template, name, ii, events = {}, node, jj;
			for (ii in this.fields)
			{
				if (this.fields.hasOwnProperty(ii))
				{
					if (this.fields[ii].template && this.fields[ii].template.indexOf('#' + ii + '#') >= 0)
					{
						name = this.id + ii.toUpperCase().substr(0, 1) + ii.substr(1);
						node = this.setProps(ii, this[ii], true);
						template = template.replace('#' + ii + '#', '<span id="' + name + '" class="' + this.fields[ii]["className"] + '">' + (
							BX.type.isNotEmptyString(node.html) ? node.html.replace("#", "<\x19>") : node.html) + '</span>');
						for (jj in node.events)
						{
							if (node.events.hasOwnProperty(jj))
							{
								events[jj] = node.events[jj];
							}
						}
						if (!!this.fields[ii].events)
							events[name] = this.fields[ii].events;
					}
				}
			}
			var res, patt = [], repl = [], tmp;
			while ((res = /#([^\\<\\>\\"\\']+?)#/gi.exec(template)) && !!res)
			{
				if (this[res[1]] !== undefined)
				{
					template = template.replace(res[0], BX.type.isNotEmptyString(this[res[1]]) ? this[res[1]].replace("#", "<\x19>") : this[res[1]]);
				}
				else
				{
					tmp = "<\x18" + patt.length + ">";
					patt.push(tmp);
					repl.push(res[0]);
					template = template.replace(res[0], tmp);
				}
			}
			while ((res = patt.shift()) && res)
			{
				tmp = repl.shift();
				template = template.replace(res, tmp);
			}
			template = template.replace("<\x19>", "#");
			if (!!this.fields.thumb.tagName)
			{
				res = BX.create(this.fields.thumb.tagName, {
					attrs : {
						id : (this.id + 'Thumb'),
						className : this.fields.thumb.className
					},
					events : this.fields.thumb.events,
					html : template
					}
				);
			}
			else
			{
				res = template;
			}
			this.__makeThumbEventsObj = events;
			this.__makeThumbEvents = BX.delegate(function()
			{
				var ii, jj;
				for (ii in events)
				{
					if (events.hasOwnProperty(ii) && BX(ii))
					{
						for (jj in events[ii])
						{
							if (events[ii].hasOwnProperty(jj))
							{
								BX.bind(BX(ii), jj, events[ii][jj]);
							}
						}
					}
				}
				this.__makeThumbEvents = null;
				delete this.__makeThumbEvents;
			}, this);
			BX.addCustomEvent(this, "onFileIsAppended", this.__makeThumbEvents);

			if (BX.type.isDomNode(this.file))
			{
				if (BX.type.isString(template))
				{
					this.__bindFileNode = BX.delegate(function(id)
					{
						var node = BX(id + 'Item');
						if (node.tagName == 'TR')
							node.cells[0].appendChild(this.file);
						else if (node.tagName == 'TABLE')
							node.rows[0].cells[0].appendChild(this.file);
						else
							BX(id + 'Item').appendChild(this.file);
						this.__bindFileNode = null;
						delete this.__bindFileNode;
					}, this);
					BX.addCustomEvent(this, "onFileIsAppended", this.__bindFileNode);
				}
				else
				{
					res.appendChild(this.file);
				}
			}
			return res;
		},
		checkProps : function()
		{
			var el2 = BX.UploaderUtils.FormToArray({elements : [BX.proxy_context]}), ii;
			for (ii in el2.data)
			{
				if (el2.data.hasOwnProperty(ii))
					this[ii] = el2.data[ii];
			}
		},
		setProps : function(name, val, bReturn)
		{
			if (typeof name == "string")
			{
				if (name == "size")
					val = BX.UploaderUtils.getFormattedSize(this.file.size, 0);
				if (typeof this[name] != "undefined" && typeof this.fields[name] != "undefined")
				{
					this[name] = val;
					var template = this.fields[name].template.
							replace('#' + name + '#', this.fields[name]["type"] === "html" ? (val || '') : BX.util.htmlspecialchars(val || '')).
							replace(/#id#/gi, this.id),
						fii, fjj, el, result = {html : template, events : {}};

					this.hiddenForm = (!!this.hiddenForm ? this.hiddenForm : BX.create("FORM", { style : { display : "none" } } ));
					this._checkProps = (!!this._checkProps ? this._checkProps : BX.delegate(this.checkProps, this));
					this.hiddenForm.innerHTML = template;
					if (this.hiddenForm.elements.length > 0)
					{
						for (fii = 0; fii < this.hiddenForm.elements.length; fii++)
						{
							el = this.hiddenForm.elements[fii];
							if (typeof this[el.name] != "undefined")
							{
								if (!el.hasAttribute("id"))
									el.setAttribute("id", this.id + name + BX.UploaderUtils.getId());
								result.events[el.id] = {
									blur : this._checkProps
								}

							}
						}
						result.html = this.hiddenForm.innerHTML;
					}
					if (BX(this.hiddenForm))
						BX.remove(this.hiddenForm);
					this.hiddenForm = null;
					delete this.hiddenForm;
					if (bReturn)
						return result;
					var node = this.getPH(name);
					if (!!node)
					{
						node.innerHTML = result.html;
						for (fii in result.events)
						{
							if (result.events.hasOwnProperty(fii))
							{
								for (fjj in result.events[fii])
								{
									if (result.events[fii].hasOwnProperty(fjj))
									{
										BX.bind(BX(fii), fjj, result.events[fii][fjj]);
									}
								}
							}
						}
					}
				}
			}
			else if (!!name)
			{
				for (var ij in name)
				{
					if (name.hasOwnProperty(ij))
					{
						if (this.fields.hasOwnProperty(ij) && ij !== "preview")
							this.setProps(ij, name[ij]);
					}
				}
			}
			return true;
		},
		getProps : function(name)
		{
			if (name == "canvas")
			{
				return BX(this.id + "ProperCanvas");
			}
			else if (typeof name == "string")
			{
				return this[name];
			}
			var data = {};
			for (var ii in this.fields)
			{
				if (this.fields.hasOwnProperty(ii) && (ii !== "preview" && ii !== "thumb"))
				{
					data[ii] = this[ii];
				}
			}
			data["size"] = this.file["size"];
			data["type"] = this["type"];
			if (!!this.copies)
			{
				var copy;
				data["canvases"] = {};
				while ((copy = this.copies.getNext()) && !!copy)
				{
					data["canvases"][copy.id] = { width : copy.width, height : copy.height, name : copy.name };
				}
			}
			return data;
		},
		getThumbs : function()
		{
			return null;
		},
		getPH : function(name)
		{
			name = (typeof name === "string" ? name : "");
			name = name.toLowerCase();
			if (this.fields.hasOwnProperty(name))
			{
				var id = name.substr(0, 1).toUpperCase() + name.substr(1);
				this.fields[name]["placeHolder"] = BX(this.id  + id);
				return this.fields[name]["placeHolder"];
			}
			return null;
		},
		clickFile : function ()
		{
			return false;
		},
		makePreview: function()
		{
			this.status = statuses.ready;
			BX.onCustomEvent(this, "onFileIsInited", [this.id, this, this.caller]);
			BX.onCustomEvent(this.caller, "onFileIsInited", [this.id, this, this.caller]);

			this.log('is initialized as a file');
		},
		preparationStatus : statuses.ready,
		deleteFile: function()
		{
			var ii, events = this.__makeThumbEventsObj;
			for (ii in this.fields)
			{
				if (this.fields.hasOwnProperty(ii))
				{
					if (!!this.fields[ii]["placeHolder"])
					{
						this.fields[ii]["placeHolder"] = null;
						BX.unbindAll(this.fields[ii]["placeHolder"]);
						delete this.fields[ii]["placeHolder"];
					}
				}
			}

			for (ii in events)
			{
				if (events.hasOwnProperty(ii) && BX(ii))
				{
					BX.unbindAll(BX(ii));
				}
			}

			this.file = null;
			delete this.file;

			BX.remove(this.canvas);
			this.canvas = null;
			delete this.canvas;

			BX.onCustomEvent(this.caller, "onFileIsDeleted", [this.id, this, this.caller]);
			BX.onCustomEvent(this, "onFileIsDeleted", [this, this.caller]);
		}
	};
	BX.UploaderImage = function(file, params, limits, caller)
	{
		this.dialogName = "BX.UploaderImage";
		BX.UploaderImage.superclass.constructor.apply(this, arguments);
		this.isImage = true;
		this.copies = new BX.UploaderUtils.Hash();
		this.caller = caller;

		if (!this.isNode && BX.Uploader.getInstanceName() == "BX.Uploader")
		{
			if (!!params["copies"])
			{
				var copies = params["copies"], copy;
				for (var ii in copies)
				{
					if (copies.hasOwnProperty(ii) && !!copies[ii])
					{
						copy = { width : parseInt(copies[ii]['width']), height : parseInt(copies[ii]["height"]), id : ii };
						if (copy['width'] > 0 && copy["height"] > 0)
						{
							this.copies.setItem(ii, copy);
						}
					}
				}
			}
			this.preparationStatus = statuses["new"];
			BX.addCustomEvent(this, "onFileHasToBePrepared", BX.delegate(function()
			{
				this.preparationStatus = statuses.inprogress;
				if (this.status != statuses["new"])
				{
					upld.push(this.file, BX.delegate(this.makeCopies, this));
				}
			}, this));
			BX.addCustomEvent(this, "onUploadDone", BX.delegate(function()
			{
				var copy;
				while ((copy = this.copies.getNext()) && !!copy)
				{
					copy.file = null;
					delete copy.file;
				}
				this.preparationStatus = statuses["new"];
			}, this));
			this.canvas = BX.create('CANVAS', {attrs : { id : this.id + "ProperCanvas" } } );
		}
		else
		{
			this.preparationStatus = statuses.done;
			this.canvas = null;
		}
		return this;
	};
	BX.extend(BX.UploaderImage, BX.UploaderFile);
	BX.UploaderImage.prototype.makePreviewImageWork = function(image, cnv, ctx, exifOrientation)
	{
		exifOrientation = parseInt(exifOrientation);

		var result = null,
			width = cnv.width,
			height = cnv.height;

		if (this.file)
		{
			this.file.width = cnv.width;
			this.file.height = cnv.height;
		}

		if (!!this.canvas)
		{
			setOrientation(image, cnv, ctx, exifOrientation);
			if (this.file)
			{
				this.file.width = cnv.width;
				this.file.height = cnv.height;
				if (exifOrientation)
				{
					this.file.exif = {
						Orientation : exifOrientation
					}
				}
			}
			this.applyFile(cnv, false);
			result = this.canvas;
		}
		else if (BX(this.id + 'Canvas'))
		{
			var res2 = BX.UploaderUtils.scaleImage({width : width, height : height}, this.fields.preview.params),
				props = {
					props : { width : res2.destin.width, height : res2.destin.height, src : image.src },
					attrs : {
						className : (this.file.width > this.file.height ? "landscape" : "portrait")
					}
				};
			switch (exifOrientation)
			{
				case 2:
					props.attrs.className += ' flip'; break;
				case 3:
					props.attrs.className += ' rotate-180'; break;
				case 4:
					props.attrs.className += ' flip-and-rotate-180'; break;
				case 5:
					props.attrs.className += ' flip-and-rotate-270'; break;
				case 6:
					props.attrs.className += ' rotate-90'; break;
				case 7:
					props.attrs.className += ' flip-and-rotate-90'; break;
				case 8:
					props.attrs.className += ' rotate-270'; break;
			}
			result = BX.create("IMG", props);
		}

		BX.onCustomEvent(this, "onFileCanvasIsLoaded", [this.id, this, this.caller, image]);
		BX.onCustomEvent(this.caller, "onFileCanvasIsLoaded", [this.id, this, this.caller, image]);

		if (BX(this.id + 'Canvas'))
			BX(this.id + 'Canvas').appendChild(result);

		return result;
	};

	BX.UploaderImage.prototype.makePreviewImageLoadHandler = function(image, canvas, context, exifOrientation){
		this.makePreviewImageWork(image, canvas, context, exifOrientation);
		this.status = statuses.ready;

		BX.onCustomEvent(this, "onFileIsInited", [this.id, this, this.caller]);
		BX.onCustomEvent(this.caller, "onFileIsInited", [this.id, this, this.caller]);
		this.log('is initialized as an image with preview');
		if (this.preparationStatus == statuses.inprogress)
			this.makeCopies(image, canvas, context, exifOrientation);
		if (this["_makePreviewImageLoadHandler"])
		{
			this._makePreviewImageLoadHandler = null;
			delete this._makePreviewImageLoadHandler;
		}
		if (this["_makePreviewImageFailedHandler"])
		{
			this._makePreviewImageFailedHandler = null;
			delete this._makePreviewImageFailedHandler;
		}
	};

	BX.UploaderImage.prototype.makePreviewImageFailedHandler = function(){
		this.status = statuses.ready;
		this.preparationStatus = statuses.done;

		BX.onCustomEvent(this, "onFileIsInited", [this.id, this, this.caller]);
		BX.onCustomEvent(this.caller, "onFileIsInited", [this.id, this, this.caller]);

		this.log('is initialized without canvas');
		if (this["_makePreviewImageLoadHandler"])
		{
			this._makePreviewImageLoadHandler = null;
			delete this._makePreviewImageLoadHandler;
		}
		if (this["_makePreviewImageFailedHandler"])
		{
			this._makePreviewImageFailedHandler = null;
			delete this._makePreviewImageFailedHandler;
		}
	};
	BX.UploaderImage.prototype.makePreview = function()
	{
		if (!this.isNode)
		{
			this._makePreviewImageLoadHandler = BX.delegate(this.makePreviewImageLoadHandler, this);
			this._makePreviewImageFailedHandler = BX.delegate(this.makePreviewImageFailedHandler, this);
			prvw.push(this.file, this._makePreviewImageLoadHandler, this._makePreviewImageFailedHandler);
		}
		else
		{
			this.status = statuses.ready;
			BX.onCustomEvent(this, "onFileIsInited", [this.id, this, this.caller]);
			BX.onCustomEvent(this.caller, "onFileIsInited", [this.id, this, this.caller]);

			this.log('is initialized as an image without preview');
			if (this.caller.queue.placeHolder)
			{
				this._onFileHasGotPreview = BX.delegate(function(id, item) {

					BX.removeCustomEvent(this, "onFileHasGotPreview", this._onFileHasGotPreview);
					BX.removeCustomEvent(this, "onFileHasNotGotPreview", this._onFileHasNotGotPreview);

					this._makePreviewImageLoadHandler = BX.delegate(function(image){
						image = this.makePreviewImageWork(image);
						BX.onCustomEvent(this, "onFileHasPreview", [item.id, item, image]);
						delete this._makePreviewImageLoadHandler;
						delete this._makePreviewImageFailedHandler;
					}, this);
					this._makePreviewImageFailedHandler = BX.delegate(function(image){
						delete this._makePreviewImageLoadHandler;
						delete this._makePreviewImageFailedHandler;
					}, this);
					prvw.push({tmp_url : item.file.url}, this._makePreviewImageLoadHandler, this._makePreviewImageFailedHandler);
				}, this);
				this._onFileHasNotGotPreview = BX.delegate(function(id){
					if (id == this.id)
					{
						BX.removeCustomEvent(this, "onFileHasGotPreview", this._onFileHasGotPreview);
						BX.removeCustomEvent(this, "onFileHasNotGotPreview", this._onFileHasNotGotPreview);
					}
				}, this);
				BX.addCustomEvent(this, "onFileHasGotPreview", this._onFileHasGotPreview);
				BX.addCustomEvent(this, "onFileHasNotGotPreview", this._onFileHasNotGotPreview);
				BX.onCustomEvent(this.caller, "onFileNeedsPreview", [this.id, this, this.caller]);
			}
		}
		return true;
	};
	BX.UploaderImage.prototype.checkPreview = function()
	{
		// TODO check preview
	};
	BX.UploaderImage.prototype.applyFile = function(cnv, params)
	{
		this.checkPreview();

		if (!!params && params.data )
			this.setProps(params.data);

		var realScale = BX.UploaderUtils.scaleImage(cnv, {width : this.limits["uploadFileWidth"], height : this.limits["uploadFileHeight"]}),
			prvwScale = BX.UploaderUtils.scaleImage(cnv, this.fields.preview.params),
			prvwProps = {
				props : { width : prvwScale.destin.width, height : prvwScale.destin.height },
				attrs : {
					className : "bx-bxu-proper-canvas"+(prvwScale.destin.width > prvwScale.destin.height ? " landscape" : " portrait")
				}
			};

		if (realScale.bNeedCreatePicture || !!params)
		{
			BX.adjust(canvas, { props : { width : realScale.destin.width, height : realScale.destin.height } } );
			ctx = canvas.getContext('2d');
			ctx.drawImage(cnv,
				realScale.source.x, realScale.source.y, realScale.source.width, realScale.source.height,
				realScale.destin.x, realScale.destin.y, realScale.destin.width, realScale.destin.height
			);

			var dataURI = canvas.toDataURL(this.file.type);
			this.file = BX.UploaderUtils.dataURLToBlob(dataURI);
		}

		this.file.name = this.name;
		this.file.width = realScale.destin.width;
		this.file.height = realScale.destin.height;

		BX.adjust(this.canvas, prvwProps);

		ctx = this.canvas.getContext('2d');
		ctx.drawImage(cnv,
			prvwScale.source.x, prvwScale.source.y, prvwScale.source.width, prvwScale.source.height,
			prvwScale.destin.x, prvwScale.destin.y, prvwScale.destin.width, prvwScale.destin.height
		);

		ctx = null;
		cnv = null;

		this.setProps('size');
		this.status = statuses.changed;
	};
	BX.UploaderImage.prototype.clickFile = function()
	{
		if (!this.canvas || !BX["CanvasEditor"] || this.status == statuses["new"])
			return false;
		if (!this.__showEditor)
		{
			this.__showEditor = BX.delegate(this.showEditor, this);
			this.eFunc = {
				"apply" : BX.delegate(this.applyFile, this),
				"delete" : BX.delegate(this.deleteFile, this),
				"clear" : BX.delegate(function()
				{
					BX.removeCustomEvent(editor, "onApplyCanvas", this.eFunc["apply"]);
					BX.removeCustomEvent(editor, "onDeleteCanvas", this.eFunc["delete"]);
					BX.removeCustomEvent(editor, "onClose", this.eFunc["clear"]);
				}, this)
			};
		}
		var template = this.fields.thumb.editorTemplate, name;
		for (var ii in this.fields)
		{
			if (this.fields.hasOwnProperty(ii))
			{
				name = ii.substr(0, 1).toUpperCase() + ii.substr(1);
				template = template.replace('#' + ii + '#',
					(ii === "preview" ? "" :
						('<span id="' + this.id + name + 'Editor" class="' + this.fields[ii]["className"] + '">' +
						this.fields[ii]["editorTemplate"].replace('#' + ii + '#', (!!this[ii] ? BX.util.htmlspecialchars(this[ii]) : '')) + '</span>')));
			}
		}

		BX.adjust(edtr.getCanvas(), { props : { width : this.file.width, height : this.file.height } } );
		edtr.getContext().drawImage(this.canvas,
			0, 0, this.canvas.width, this.canvas.height,
			0, 0, edtr.getCanvas().width, edtr.getCanvas().height);
		var editor = BX.CanvasEditor.show(edtr.getCanvas(), {title : this.name, template : template});

		BX.addCustomEvent(editor, "onApplyCanvas", this.eFunc["apply"]);
		BX.addCustomEvent(editor, "onDeleteCanvas", this.eFunc["delete"]);
		BX.addCustomEvent(editor, "onClose", this.eFunc["clear"]);
		BX.onCustomEvent(this, "onCanvasEditorIsCreated", [editor, this]);

		edtr.push(this.file, this.__showEditor);
		this.editor = editor;
		return false;
	};
	BX.UploaderImage.prototype.showEditor = function(image, canvas, context, exifOrientation)
	{
		BX.adjust(canvas, { props : { width : this.file.width, height : this.file.height } } );
		setOrientation(image, canvas, context, exifOrientation);
		this.editor.copyCanvas(canvas);
	};
	BX.UploaderImage.prototype.makeCopies = function(image, cnv, ctx, exifOrientation)
	{
		var copy, res, dataURI, result,
			context = canvas.getContext('2d');
		setOrientation(image, canvas, context, exifOrientation);
		while ((copy = this.copies.getNext()) && !!copy)
		{
			res = BX.UploaderUtils.scaleImage(canvas, copy);
			BX.adjust(cnv, {props : { width : res.destin.width, height : res.destin.height } } );
			ctx.drawImage(canvas,
				res.source.x, res.source.y, res.source.width, res.source.height,
				res.destin.x, res.destin.y, res.destin.width, res.destin.height
			);

			dataURI = cnv.toDataURL(this.file.type);
			result = BX.UploaderUtils.dataURLToBlob(dataURI);
			result.width = cnv.width;
			result.height = cnv.height;
			result.name = this.name;
			result.thumb = copy.id;
			result.canvases = this.copies.length;
			result.canvas = this.copies.pointer - 1;
			copy.file = result;
		}
		this.preparationStatus = statuses.done;
	};
	BX.UploaderImage.prototype.getThumbs = function(name)
	{
		if (name == "getCount")
			return this.copies.length;

		var res = (typeof name == "string" ? this.copies.getItem(name) : this.copies.getNext());

		if (!!res)
			return res.file;
		return null;
	};
	return true;
}(window));

/* End */
;
; /* Start:"a:4:{s:4:"full";s:63:"/bitrix/js/main/core/core_uploader/queue.min.js?151801858511002";s:6:"source";s:43:"/bitrix/js/main/core/core_uploader/queue.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
(function(e){if(e.BX["UploaderQueue"])return false;var t=e.BX,i={new:0,ready:1,preparing:2,inprogress:3,done:4,failed:5,stopped:6,changed:7,uploaded:8};t.UploaderQueue=function(e,i,s){this.dialogName="BX.UploaderQueue";i=!!i?i:{};this.limits={phpPostMaxSize:i["phpPostMaxSize"],phpUploadMaxFilesize:i["phpUploadMaxFilesize"],uploadMaxFilesize:i["uploadMaxFilesize"]>0?i["uploadMaxFilesize"]:0,uploadFileWidth:i["uploadFileWidth"]>0?i["uploadFileWidth"]:0,uploadFileHeight:i["uploadFileHeight"]>0?i["uploadFileHeight"]:0};this.placeHolder=t(e["placeHolder"]);this.showImage=e["showImage"]!==false;this.sortItems=e["sortItems"]!==false;this.uploader=s;this.itForUpload=new t.UploaderUtils.Hash;this.items=new t.UploaderUtils.Hash;this.itUploaded=new t.UploaderUtils.Hash;this.itFailed=new t.UploaderUtils.Hash;this.thumb={tagName:"LI",className:"bx-bxu-thumb-thumb"};if(!!e["thumb"]){for(var r in e["thumb"]){if(e["thumb"].hasOwnProperty(r)&&this.thumb.hasOwnProperty(r)){this.thumb[r]=e["thumb"][r]}}}t.addCustomEvent(s,"onItemIsAdded",t.delegate(this.addItem,this));t.addCustomEvent(s,"onItemsAreAdded",t.delegate(this.finishQueue,this));t.addCustomEvent(s,"onFileIsDeleted",t.delegate(this.deleteItem,this));t.addCustomEvent(s,"onFileIsReinited",t.delegate(this.reinitItem,this));this.log("Initialized");return this};t.UploaderQueue.prototype={showError:function(e){this.log("Error! "+e)},log:function(e){t.UploaderUtils.log("queue",e)},addItem:function(s,r){var d;if(!this.showImage)d=false;else if(t.type.isDomNode(s))d=t.UploaderUtils.isImage(s.value,null,null);else d=t.UploaderUtils.isImage(s["name"],s["type"],s["size"]);t.onCustomEvent(this.uploader,"onFileIsBeforeCreated",[s,r,d,this.uploader]);var a={copies:this.uploader.fileCopies,fields:this.uploader.fileFields},o=d?new t.UploaderImage(s,a,this.limits,this.uploader):new t.UploaderFile(s,a,this.limits,this.uploader),l,n,u={status:i.ready};t.onCustomEvent(o,"onFileIsAfterCreated",[o,r,u,this.uploader]);t.onCustomEvent(this.uploader,"onFileIsAfterCreated",[o,r,u,this.uploader]);this.items.setItem(o.id,o);if(r||u["status"]!==i.ready){this.itUploaded.setItem(o.id,o)}else{this.itForUpload.setItem(o.id,o)}if(!!this.placeHolder){if(t(r)){o.thumbNode=n=t(r);n.setAttribute("bx-bxu-item-id",o.id)}else{l=o.makeThumb();n=t.create(this.thumb.tagName,{attrs:{id:o.id+"Item","bx-bxu-item-id":o.id,className:this.thumb.className}});if(t.type.isNotEmptyString(l)){if(this.thumb.tagName=="TR"){l=l.replace(/[\n\t]/gi,"").replace(/^(\s+)(.*?)/gi,"$2").replace(/(.*?)(\s+)$/gi,"$1");if(!!l["trim"])l=l.trim();var h=function(e,t,i){var s=n.insertCell(-1),r={colspan:true,headers:true,accesskey:true,class:true,contenteditable:true,contextmenu:true,dir:true,hidden:true,id:true,lang:true,spellcheck:true,style:true,tabindex:true,title:true,translate:true},d;s.innerHTML=i;t=t.split(" ");while((d=t.pop())&&d){d=d.split("=");if(d.length==2){d[0]=d[0].replace(/^(\s+)(.*?)/gi,"$2").replace(/(.*?)(\s+)$/gi,"$1").replace(/^["'](.*?)["']$/gi,"$1");d[1]=d[1].replace(/^(\s+)(.*?)/gi,"$2").replace(/(.*?)(\s+)$/gi,"$1").replace(/^["'](.*?)["']$/gi,"$1");if(r[d[0]]===true)s.setAttribute(d[0],d[1]);else s[d[0]]=d[1]}}return""},p=/^<td(.*?)>(.*?)<\/td>/i;e.data1=l;while(p.test(l))l=l.replace(p,h)}else{n.innerHTML=l}}else if(t.type.isDomNode(l)){t.adjust(n,{children:[l]})}}if(!!e["jsDD"]&&this.sortItems){if(!this._onbxdragstart){this._onbxdragstart=t.delegate(this.onbxdragstart,this);this._onbxdragstop=t.delegate(this.onbxdragstop,this);this._onbxdrag=t.delegate(this.onbxdrag,this);this._onbxdraghout=t.delegate(this.onbxdraghout,this);this._onbxdestdraghover=t.delegate(this.onbxdestdraghover,this);this._onbxdestdraghout=t.delegate(this.onbxdestdraghout,this);this._onbxdestdragfinish=t.delegate(this.onbxdestdragfinish,this)}t.addClass(n,"bx-drag-draggable");n.onbxdragstart=this._onbxdragstart;n.onbxdragstop=this._onbxdragstop;n.onbxdrag=this._onbxdrag;n.onbxdraghout=this._onbxdraghout;e.jsDD.registerObject(n);n.onbxdestdraghover=this._onbxdestdraghover;n.onbxdestdraghout=this._onbxdestdraghout;n.onbxdestdragfinish=this._onbxdestdragfinish;e.jsDD.registerDest(n)}n.setAttribute("bx-item-id",o.id);if(t(r)){t.onCustomEvent(this.uploader,"onFileIsBound",[o.id,o,this.caller,r]);t.onCustomEvent(o,"onFileIsBound",[o.id,o,this.caller,r])}else if(!!r){this.placeHolder.appendChild(n);t.onCustomEvent(this.uploader,"onFileIsAttached",[o.id,o,this.caller,r]);t.onCustomEvent(o,"onFileIsAttached",[o.id,o,this.caller,r])}else{this.placeHolder.appendChild(n);t.onCustomEvent(this.uploader,"onFileIsAppended",[o.id,o,this.caller]);t.onCustomEvent(o,"onFileIsAppended",[o.id,o,this.caller])}}t.onCustomEvent(this.uploader,"onQueueIsChanged",[this,"add",o.id,o])},getItem:function(e){var i=this.items.getItem(e);if(i)return{item:i,node:i.thumbNode||t(e+"Item")};return null},onbxdragstart:function(){var e=t.proxy_context,i=e&&e.getAttribute("bx-item-id");if(i){var s=e.innerHTML.replace(new RegExp(i,"gi"),"DragCopy");e.__dragCopyDiv=t.create("DIV",{attrs:{className:"bx-drag-object "+e.className},style:{position:"absolute",zIndex:10,width:e.clientWidth+"px"},html:s});e.__dragCopyPos=t.pos(e);t.onCustomEvent(this.uploader,"onBxDragStart",[e,e.__dragCopyDiv]);document.body.appendChild(e.__dragCopyDiv);t.addClass(e,"bx-drag-source");var r=t("DragCopyProperCanvas"),d,a=this.items.getItem(i);if(r&&(a&&t(a.canvas))){d=a.canvas.cloneNode(true);r.parentNode.replaceChild(d,r);d.getContext("2d").drawImage(a.canvas,0,0)}}return true},onbxdragstop:function(){var e=t.proxy_context;if(e.__dragCopyDiv){t.removeClass(e,"bx-drag-source");e.__dragCopyDiv.parentNode.removeChild(e.__dragCopyDiv);e.__dragCopyDiv=null;delete e["__dragCopyDiv"];delete e["__dragCopyPos"]}return true},onbxdrag:function(e,i){var s=t.proxy_context,r=s.__dragCopyDiv;if(r){if(s.__dragCopyPos){if(!s.__dragCopyPos.deltaX)s.__dragCopyPos.deltaX=s.__dragCopyPos.left-e;if(!s.__dragCopyPos.deltaY)s.__dragCopyPos.deltaY=s.__dragCopyPos.top-i;e+=s.__dragCopyPos.deltaX;i+=s.__dragCopyPos.deltaY}r.style.left=e+"px";r.style.top=i+"px"}},onbxdraghout:function(e,t,i){},onbxdestdraghover:function(e){if(!e||!e.hasAttribute("bx-bxu-item-id")||!this.items.hasItem(e.getAttribute("bx-bxu-item-id")))return;var i=t.proxy_context;t.addClass(i,"bx-drag-over");return true},onbxdestdraghout:function(){var e=t.proxy_context;t.removeClass(e,"bx-drag-over");return true},onbxdestdragfinish:function(e){var i=t.proxy_context;t.removeClass(i,"bx-drag-over");if(i==e||!t.hasClass(e,"bx-drag-draggable"))return true;var s=e.getAttribute("bx-bxu-item-id");if(!this.items.hasItem(s))return;var r=i.parentNode,d=r.childNodes.length,a,o,l,n;for(n=0;n<d;n++){if(r.childNodes[n]==i)i.number=n;else if(r.childNodes[n]==e)e.number=n;if(e.number>0&&i.number>0)break}if(this.itForUpload.hasItem(s)){a=i.number<=e.number?"beforeItem":i.nextSibling?"afterItem":"inTheEnd";o=null;if(a!="inTheEnd"){for(n=i.number+(a=="beforeItem"?0:1);n<d;n++){if(this.itForUpload.hasItem(r.childNodes[n].getAttribute("bx-bxu-item-id"))){o=r.childNodes[n].getAttribute("bx-bxu-item-id");break}}if(o===null)a="inTheEnd"}l=this.itForUpload.removeItem(e.getAttribute("bx-bxu-item-id"));if(a!="inTheEnd")this.itForUpload.insertBeforeItem(l.id,l,o);else this.itForUpload.setItem(l.id,l)}a=i.number<=e.number?"beforeItem":i.nextSibling?"afterItem":"inTheEnd";o=null;if(a!="inTheEnd"){for(n=i.number+(a=="beforeItem"?0:1);n<d;n++){if(this.items.hasItem(r.childNodes[n].getAttribute("bx-bxu-item-id"))){o=r.childNodes[n].getAttribute("bx-bxu-item-id");break}}if(o===null)a="inTheEnd"}l=this.items.removeItem(e.getAttribute("bx-bxu-item-id"));if(a!="inTheEnd")this.items.insertBeforeItem(l.id,l,o);else this.items.setItem(l.id,l);e.parentNode.removeChild(e);if(i.number<=e.number){i.parentNode.insertBefore(e,i)}else if(i.nextSibling){i.parentNode.insertBefore(e,i.nextSibling)}else{for(n=0;n<d;n++){if(r.childNodes[n]==i)i.number=n;else if(r.childNodes[n]==e)e.number=n}if(i.number<=e.number){i.parentNode.insertBefore(e,i)}else{i.parentNode.appendChild(e)}}t.onCustomEvent(i,"onFileOrderIsChanged",[i.id,i,this.caller]);t.onCustomEvent(this.uploader,"onQueueIsChanged",[this,"sort",i.id,i]);return true},deleteItem:function(i,s){var r=this.getItem(i),d;if(r&&(!this.placeHolder||(d=r.node)&&d)){if(!!d){if(!!e["jsDD"]){d.onmousedown=null;d.onbxdragstart=null;d.onbxdragstop=null;d.onbxdrag=null;d.onbxdraghout=null;d.onbxdestdraghover=null;d.onbxdestdraghout=null;d.onbxdestdragfinish=null;d.__bxpos=null;e.jsDD.arObjects[d.__bxddid]=null;delete e.jsDD.arObjects[d.__bxddid];e.jsDD.arDestinations[d.__bxddeid]=null;delete e.jsDD.arDestinations[d.__bxddeid]}t.unbindAll(d);if(s["replaced"]!==true)d.parentNode.removeChild(d)}this.items.removeItem(i);this.itUploaded.removeItem(i);this.itFailed.removeItem(i);this.itForUpload.removeItem(i);t.onCustomEvent(this.uploader,"onQueueIsChanged",[this,"delete",i,s]);return true}return false},reinitItem:function(i,s){var r,d;if(!!this.placeHolder&&this.items.hasItem(i)&&(r=t(i+"Item"))&&r){d=s.makeThumb();if(t.type.isNotEmptyString(d)){if(this.thumb.tagName=="TR"){d=d.replace(/[\n\t]/gi,"").replace(/^(\s+)(.*?)/gi,"$2").replace(/(.*?)(\s+)$/gi,"$1");if(!!d["trim"])d=d.trim();var a=function(e,t,i){var s=r.insertCell(-1),d={colspan:true,headers:true,accesskey:true,class:true,contenteditable:true,contextmenu:true,dir:true,hidden:true,id:true,lang:true,spellcheck:true,style:true,tabindex:true,title:true,translate:true},a;s.innerHTML=i;t=t.split(" ");while((a=t.pop())&&a){a=a.split("=");if(a.length==2){a[0]=a[0].replace(/^(\s+)(.*?)/gi,"$2").replace(/(.*?)(\s+)$/gi,"$1").replace(/^["'](.*?)["']$/gi,"$1");a[1]=a[1].replace(/^(\s+)(.*?)/gi,"$2").replace(/(.*?)(\s+)$/gi,"$1").replace(/^["'](.*?)["']$/gi,"$1");if(d[a[0]]===true)s.setAttribute(a[0],a[1]);else s[a[0]]=a[1]}}return""},o=/^<td(.*?)>(.*?)<\/td>/i;e.data1=d;while(o.test(d))d=d.replace(o,a)}else{r.innerHTML=d}}else if(t.type.isDomNode(d)){while(t(r.firstChild)){t.remove(r.firstChild)}t.adjust(r,{children:[d]})}t.onCustomEvent(this.uploader,"onFileIsAppended",[s.id,s,this.caller]);t.onCustomEvent(s,"onFileIsAppended",[s.id,s,this.caller])}},finishQueue:function(){},clear:function(){var e;while((e=this.items.getFirst())&&!!e)this.deleteItem(e.id,e)},restoreFiles:function(e,i,s){i=i===true;var r=e.getFirst();while(r){if(this.items.hasItem(r.id)&&(s===true||!this.itUploaded.hasItem(r.id))&&(i||!this.itFailed.hasItem(r.id))){if(this.itFailed.hasItem(r.id)||s===true){delete r["uploadStatus"];delete r.file["uploadStatus"];delete r.file["firstChunk"];delete r.file["package"];delete r.file["packages"];if(r.file["copies"]){r.file["copies"].reset();var d;while((d=r.file["copies"].getNext())&&d){delete d["uploadStatus"];delete d["firstChunk"];delete d["package"];delete d["packages"]}r.file["copies"].reset()}r["restored"]="Y"}else{r["restored"]="C"}this.itFailed.removeItem(r.id);this.itUploaded.removeItem(r.id);this.itForUpload.setItem(r.id,r);t.onCustomEvent(r,"onUploadRestore",[r])}r=e.getNext()}}};return i})(window);
/* End */
;
//# sourceMappingURL=kernel_coreuploader.map.js