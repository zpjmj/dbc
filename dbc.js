//public 变量_开头
let dbc = (function (cid3d, cid2d) {
  const dbc_type_point = 1;
  const dbc_type_face = 2;
  //中间连接件
  const dbc_type_middle = 3;
  //基本件
  const dbc_type_baseObj = 4;
  //组合体
  const dbc_type_combinant = 5;

  try {
    /**
     * 各种msg
     * @param null
     */
    let msg = (() => {
      return {
        m1: "创建shader对象失败",
        m2: "shader编译失败：",
        m3: "创建program对象失败",
        m4: "Link着色器失败：",
        m5: "获取上下文失败",
        m7: "立方体的长必须给定",
        m8: "obj 未加入render中无法消除",
        m9: "没有定义的基本对象",
        m10: "不是锥体",
        m11: "近裁切面<0",
        m12: "远裁切面<0",

      }
    })();
    /**
     * 公共方法
     */
    let util = (function () {
      //时间对象
      let clock = (function () {
        let clock = {};
        if (typeof performance === 'undefined') {
          clock.now = function () {
            return Date.now();
          }
        } else {
          clock.now = function () {
            return performance.now();
          }
        }
        return clock;
      })();

      return {
        /**
         * 抛出异常输出错误信息
         * @param m 需要输出的错误信息没
         */
        error: (m) => {
          e = {};
          m ? e.msg = m : e.msg = "";
          throw e;
        },
        /**
         * 输出debuglog 
         * @param m 需要返回的信息 
         * @param b 默认0打印到控制台，指定则使用alert打印
         */
        debugLog: (m, b = 0) => {
          b ? alert(m) : console.log(m);
        },
        /**
         * 获取webgl上下文 
         * @param a canvas对象 
         * @param glVersion 默认不指定状态是去webgl1上下文 指定后取webgl2
         */
        getWebGLContext: (a, glVersion) => {
          let version = 1
          let n = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
          if (!util.reType(glVersion, "undefined")) {
            n = ["webgl2"];
            version = 2
          }
          let c = null;
          for (let i = 0, l = n.length; i < l; ++i) {
            try {
              c = a.getContext(n[i]);
            } catch (e) {
            }
            if (c) {
              break;
            }
          }
          c.version = version;
          return c;
        },
        //返回类型 要判断的变量,类型_要比较的变量
        /**
         * 进行类型比较
         * @param name 需要比较的对象
         * @param type 进行比较的类型
         * @returns 不指定type则返回类型，指定则返回比较结果
         */
        reType: (name, type) => {
          var a = Object.prototype.toString.call(name);
          a = a.replace("[object ", "");
          a = a.replace("]", "");
          if (type) {
            a = a.toUpperCase();
            type = type.toUpperCase();
            if (a === type) {
              return 1;
            } else {
              return 0;
            }
          } else {
            return a;
          }
        },
        clock: () => clock,
        /**
         * 获取世界坐标距离
         * 01, o2 各自对象的 _xyz 对象
         */
        getDistance: function (o1, o2) {
          let arr1 = o1._wArr;
          let arr2 = o2._wArr;

          let x = arr1[0] - arr2[0];
          let y = arr1[1] - arr2[1];
          let z = arr1[2] - arr2[2];

          return Math.sqrt(x * x + y * y + z * z);
        }

      }
    })();
    /**
     * 配置dbc对象
     */
    let config = (function () {
      let gl2;
      let gl3;
      let canvas2;
      let canvas3;
      let requestAnimationFrame;
      let cancelAnimationFrame
      let pc_phone;

      /**
       * 移动端还是pc端
       */
      +function () {
        let sUserAgent = navigator.userAgent.toLowerCase();
        let bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
        let bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
        let bIsMidp = sUserAgent.match(/midp/i) == "midp";
        let bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
        let bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
        let bIsAndroid = sUserAgent.match(/android/i) == "android";
        let bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
        let bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";
        if (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
          pc_phone = "phone";
        } else {
          pc_phone = "pc";
        }
      }();

      /**
       * 动画
       */
      (function () {
        var lastTime = 0;
        var vendors = ['webkit', 'moz'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
          window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
          window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||    // Webkit中此取消方法的名字变了
            window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
            var id = window.setTimeout(function () {
              callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
          };
        }
        if (!window.cancelAnimationFrame) {
          window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
          };
        }
        requestAnimationFrame = window.requestAnimationFrame;
        cancelAnimationFrame = window.cancelAnimationFrame;
      })();

      /**
         * 向Windows对象添加 addWheelListener 对象 进行鼠标滚轮绑定
         * @param {*} elem 
         * @param {*} callback 
         * @param {*} useCapture 可以为对象{
          capture: Boolean, passive: Boolean, once: Boolean}
          } 
          passive = false 时可以调用preventDefault阻止默认事件
         */
      (function (window, document) {

        var prefix = "", _addEventListener, onwheel, support;

        // detect event model
        if (window.addEventListener) {
          _addEventListener = "addEventListener";
        } else {
          _addEventListener = "attachEvent";
          prefix = "on";
        }

        // detect available wheel event
        support = "onwheel" in document.createElement("div") ? "wheel" : // 各个厂商的高版本浏览器都支持"wheel"
          document.onmousewheel !== undefined ? "mousewheel" : // Webkit 和 IE一定支持"mousewheel"
            "DOMMouseScroll"; // 低版本firefox

        window.addWheelListener = function (elem, callback, useCapture) {
          _addWheelListener(elem, support, callback, useCapture);

          // handle MozMousePixelScroll in older Firefox
          if (support == "DOMMouseScroll") {
            _addWheelListener(elem, "MozMousePixelScroll", callback, useCapture);
          }
        };
        function _addWheelListener (elem, eventName, callback, useCapture) {
          elem[_addEventListener](prefix + eventName, support == "wheel" ? callback : function (originalEvent) {
            !originalEvent && (originalEvent = window.event);

            // create a normalized event object
            var event = {
              // keep a ref to the original event object
              originalEvent: originalEvent,
              target: originalEvent.target || originalEvent.srcElement,
              type: "wheel",
              deltaMode: originalEvent.type == "MozMousePixelScroll" ? 0 : 1,
              deltaX: 0,
              deltaZ: 0,
              preventDefault: function () {
                originalEvent.preventDefault ?
                  originalEvent.preventDefault() :
                  originalEvent.returnValue = false;
              }
            };

            // calculate deltaY (and deltaX) according to the event
            if (support == "mousewheel") {
              event.deltaY = - 1 / 40 * originalEvent.wheelDelta;
              // Webkit also support wheelDeltaX
              originalEvent.wheelDeltaX && (event.deltaX = - 1 / 40 * originalEvent.wheelDeltaX);
            } else {
              event.deltaY = originalEvent.detail;
            }

            // it's time to fire the callback
            return callback(event);

          }, useCapture || false);
        }

      })(window, document);


      /**
       * 内部函数
       * @param {string} cid3d canvas ID
       */
      function set_canvas3 (cid3d) {
        canvas3 = document.getElementById(cid3d);
        gl3 = util.getWebGLContext(canvas3)
      }
      /**
       * 内部函数
       * @param {string} cid3d canvas ID
       */
      function set_canvas2 (cid2d) {
        canvas2 = document.getElementById(cid2d);
        gl2 = canvas2.getContext('2d');
      }

      return {
        /**
         * 设置需要渲染的canvas
         * @param {string} cid3d canvas ID
         * @param {string} cid2d canvas ID
         * @param {string} glVersion 是否需要取得webgl2上下文
         */
        set_canvas: (cid3d, cid2d, glVersion) => {
          set_canvas3(cid3d, glVersion);
          set_canvas2(cid2d);
        },
        /**
        * 设置需要渲染的canvas
        * @param {string} cid3d canvas ID
        * @param {string} glVersion 是否需要取得webgl2上下文
        */
        set_canvas3: (cid3d, glVersion) => {
          set_canvas3(cid3d, glVersion);
        },
        /**
         * 设置需要渲染的canvas
        * @param {string} cid2d canvas ID
        */
        set_canvas2: (cid2d) => {
          set_canvas2(cid2d);
        },
        /**
         * 取得3d上下文
         * @returns webgl 上下文
         */
        get_gl3: () => gl3,
        /**
        * 取得2d上下文
        * @returns 2D 上下文
        */
        get_gl2: () => gl2,
        /**
        * 取得当前正在渲染的3D画布对象
        * @returns 3D canvas
        */
        get_canvas3: () => canvas3,
        /**
        *  取得当前正在渲染的2D画布对象
        * @returns 2D canvas
        */
        get_canvas2: () => canvas2,
        /**
         * 动画方法
         */
        get_requestAnimationFrame: () => requestAnimationFrame,
        /**
         * 动画方法
         */
        get_cancelAnimationFrame: () => cancelAnimationFrame,
        /**
         * 纵横比
         */
        get_aspectRatio: () => {
          return canvas3.width / canvas3.height;
        },
        /**
         * pc端还是移动端
         */
        get_PCorPHONE: () => pc_phone,

      };
    })();
    /**
     * 着色器对象
     */
    let shader = (function () {
      //内部储存的3D上下文
      let gl3 = null;
      //用来构造返回shader对象的载体
      let baseShader = {
        shaderVsource: { source: "" },
        shaderFsource: { source: "" },
        //需要获得program的变量的数组
        programArray: [],
        //为变量设置program对象
        setProgram: function () {
          let l = this.programArray.length;
          for (let i = 0; i < l; ++i) {
            this.reShader[this.programArray[i]].program = this.program;
          }
        },
      };
      /**
       * shader的初始化函数
       */
      function init () {
        baseShader = null;
        baseShader = {
          shaderVsource: { source: "" },
          shaderFsource: { source: "" },
          programArray: [],
          setProgram: function () {
            let l = this.programArray.length;
            for (let i = 0; i < l; ++i) {
              this.reShader[this.programArray[i]].program = this.program;
            }
          },
        };
      }
      /**
       * shader共通方法
       */
      let shader_util = (function () {
        /**
         * 创建着色器程序
         * @param {shader} v 顶点shader
         * @param {shader} f 片元shader
         */
        let createProgram = (v, f) => {
          let p = gl3.createProgram();
          if (!p) util.error(msg.m3);
          //顶点shader 片元shader 对象附加到shader程序上
          gl3.attachShader(p, v);
          gl3.attachShader(p, f);
          //链接程序
          gl3.linkProgram(p);
          let sts = gl3.getProgramParameter(p, gl3.LINK_STATUS);
          if (!sts) {
            let e = gl3.getProgramInfoLog(p);
            util.debugLog(msg.m4);
            util.debugLog(e);
            gl3.deleteProgram(p);
            gl3.deleteShader(v);
            gl3.deleteShader(f);
            return null;
          }
          return p;
        };
        /**
         * 装载顶点或片元shader
         * @param {string} type v：顶点shader f：片元shader
         * @param {string} source shader的源码字符串
         */
        let loadShader = (type, source) => {
          type = (type === "v") ? gl3.VERTEX_SHADER : gl3.FRAGMENT_SHADER;
          // 创建shader对象
          let shader = gl3.createShader(type);
          if (shader == null) {
            util.error(msg.m1);
          }
          // shader对象与source绑定
          gl3.shaderSource(shader, source);
          // 编译shader
          gl3.compileShader(shader);
          // 检查是否编译成功
          let sts = gl3.getShaderParameter(shader, gl3.COMPILE_STATUS);
          if (!sts) {
            let e = gl3.getShaderInfoLog(shader);
            util.debugLog(msg.m2);
            util.debugLog(e);
            gl3.deleteShader(shader);
            return null;
          }
          return shader;
        };
        return {
          /**
           * 选择当前webgl系统使用哪个着色器程序进行渲染
           * @param {webgl.program} p shader program
           */
          useProgram: function (p) {
            return gl3.useProgram(p);
          },
          /**
           * 创建shader程序
           * @param {shader} v 顶点shader
           * @param {shader} f 片元shader
           */
          createProgram: function (v, f) {
            return createProgram(v, f);
          },
          /**
           * 装载顶点或片元shader
           * @param {string} type v：顶点shader f：片元shader
           * @param {string} source shader的源码字符串
           */
          loadShader: function (type, source) {
            return loadShader(type, source);
          },
          /**
           * 获取attribute变量的储存位置
           * @param {shader.program} program 程序 
           * @param {string} name 变量名 
           */
          getAttribLocation: function (program, name) {
            return gl3.getAttribLocation(program, name);
          },
          vertexAttrib1f: function (index, v0) {
            return gl3.vertexAttrib1f(index, v0);
          },
          vertexAttrib2f: function (index, v0, v1) {
            return gl3.vertexAttrib2f(index, v0, v1);
          },
          vertexAttrib3f: function (index, v0, v1, v2) {
            return gl3.vertexAttrib3f(index, v0, v1, v2);
          },
          vertexAttrib4f: function (index, v0, v1, v2, v3) {
            return gl3.vertexAttrib4f(index, v0, v1, v2, v3);
          },
          vertexAttrib1fv: function (index, v) {
            return gl3.vertexAttrib1fv(index, v);
          },
          vertexAttrib2fv: function (index, v) {
            return gl3.vertexAttrib2fv(index, v);
          },
          vertexAttrib3fv: function (index, v) {
            return gl3.vertexAttrib3fv(index, v);
          },
          vertexAttrib4fv: function (index, v) {
            return gl3.vertexAttrib4fv(index, v);
          },
          //uniform相关
          getUniformLocation: function (program, name) {
            return gl3.getUniformLocation(program, name);
          },
          uniformMatrix2fv: function (index, v) {
            return gl3.uniformMatrix2fv(index, false, v);
          },
          uniformMatrix3fv: function (index, v) {
            return gl3.uniformMatrix3fv(index, false, v);
          },
          uniformMatrix4fv: function (index, v) {
            return gl3.uniformMatrix4fv(index, false, v);
          },
          uniform1f: function (index, v0) {
            return gl3.uniform1f(index, v0);
          },
          uniform2f: function (index, v0, v1) {
            return gl3.uniform2f(index, v0, v1);
          },
          uniform3f: function (index, v0, v1, v2) {
            return gl3.uniform3f(index, v0, v1, v2);
          },
          uniform4f: function (index, v0, v1, v2, v3) {
            return gl3.uniform4f(index, v0, v1, v2, v3);
          },
          uniform1fv: function (index, v) {
            return gl3.uniform1fv(index, v);
          },
          uniform2fv: function (index, v) {
            return gl3.uniform2fv(index, v);
          },
          uniform3fv: function (index, v) {
            return gl3.uniform3fv(index, v);
          },
          uniform4fv: function (index, v) {
            return gl3.uniform4fv(index, v);
          },
          uniform1i: function (index, v0) {
            return gl3.uniform1i(index, v0);
          },
          uniform2i: function (index, v0, v1) {
            return gl3.uniform2i(index, v0, v1);
          },
          uniform3i: function (index, v0, v1, v2) {
            return gl3.uniform3i(index, v0, v1, v2);
          },
          uniform4i: function (index, v0, v1, v2, v3) {
            return gl3.uniform4i(index, v0, v1, v2, v3);
          },
          uniform1iv: function (index, v) {
            return gl3.uniform1iv(index, v);
          },
          uniform2iv: function (index, v) {
            return gl3.uniform2iv(index, v);
          },
          uniform3iv: function (index, v) {
            return gl3.uniform3iv(index, v);
          },
          uniform4iv: function (index, v) {
            return gl3.uniform4iv(index, v);
          },
          //缓冲区相关
          createBuffer: function () {
            return gl3.createBuffer();
          },
          createFramebuffer: function () {
            return gl3.createFramebuffer();
          },
          createRenderbuffer: function () {
            return gl3.createRenderbuffer();
          },
          deleteBuffer: function (buffer) {
            return gl3.deleteBuffer(buffer);
          },
          bindBuffer: function (target, buffer) {
            return gl3.bindBuffer(target, buffer);
          },
          bindRenderbuffer: function (target, buffer) {
            return gl3.bindRenderbuffer(target, buffer);
          },
          bindFramebuffer: function (target, buffer) {
            return gl3.bindFramebuffer(target, buffer);
          },
          bufferData1: function (target, srcData, usage) {
            return gl3.bufferData(target, srcData, usage);
          },
          bufferData2: function (target, srcData, usage, srcOffset, length) {
            return gl3.bufferData(target, srcData, usage, srcOffset, length);
          },
          vertexAttribPointer: function (index, size, type, normalized, stride, offset) {
            return gl3.vertexAttribPointer(index, size, type, normalized, stride, offset);
          },
          enableVertexAttribArray: function (index) {
            return gl3.enableVertexAttribArray(index);
          },
          disableVertexAttribArray: function (index) {
            return gl3.disableVertexAttribArray(index);
          }
        }
      })();
      //shader editer
      let edit = (function () {
        const type_attribute = 1;
        const type_uniform = 2;
        const type_varying = 3;
        const type_const = 4;
        const type_float = 5;
        const type_int = 6;
        const type_bool = 7;
        const type_vec2 = 8;
        const type_vec3 = 9;
        const type_vec4 = 10;
        const type_mat2 = 11;
        const type_mat3 = 12;
        const type_mat4 = 13;

        let tab = "";
        let line = "";
        let source = null;
        //储存限定符flg 0:没有，1:attribute 2：uniform 3：varying 4:const
        let saveFlg = 0;
        let saveArray = ["", "attribute", "uniform", "varying", "const"];
        //变量是否为flg
        let arrayFlg = 0;

        //把line中语句加入到source中
        function addSource () {
          source.source += line;
          line = "" + tab;
          saveFlg = 0;
          arrayFlg = 0;
        }

        let creFunc = {
          address: null,
          get: 0,
          value: 0,
        };

        //创建shader自身方法
        function createFunc (type, name) {
          let obj = Object.create(creFunc);
          obj.name = name;
          baseShader.programArray.push(name);
          switch (saveFlg) {
            case type_attribute:
              obj.type = gl3.FLOAT;
              obj.get = function () {
                return shader_util.getAttribLocation(this.program, this.name);
              };
              switch (type) {
                case type_float:
                  obj.num = 1;
                  obj.value = function (val) {
                    this.address = this.address ? this.address : this.get();
                    shader_util.vertexAttrib1fv(this.address, val);
                  }
                  return obj;
                case type_vec2:
                  obj.num ? 0 : obj.num = 2;
                case type_vec3:
                  obj.num ? 0 : obj.num = 3;
                case type_vec4:
                  obj.num ? 0 : obj.num = 4;
                  obj.value = function (val, val1, val2, val3) {
                    this.address = this.address ? this.address : this.get();
                    if (util.reType(val).indexOf("Array") != -1) {
                      switch (val.length) {
                        case 1:
                          shader_util.vertexAttrib1fv(this.address, val);
                          break;
                        case 2:
                          shader_util.vertexAttrib2fv(this.address, val);
                          break;
                        case 3:
                          shader_util.vertexAttrib3fv(this.address, val);
                          break;
                        case 4:
                          shader_util.vertexAttrib4fv(this.address, val);
                          break;
                      }
                    } else {
                      switch (arguments.length) {
                        case 1:
                          shader_util.vertexAttrib1f(this.address, val);
                          break;
                        case 2:
                          shader_util.vertexAttrib2f(this.address, val, val1);
                          break;
                        case 3:
                          shader_util.vertexAttrib3f(this.address, val, val1, val2);
                          break;
                        case 4:
                          shader_util.vertexAttrib4f(this.address, val, val1, val2, val3);
                          break;
                      }
                    }
                  };
                  return obj;
                case type_mat2:
                  obj.num ? 0 : obj.num = 2;
                case type_mat3:
                  obj.num ? 0 : obj.num = 3;
                case type_mat4:
                  obj.num ? 0 : obj.num = 4;
                  obj.value = function (val) {
                    this.address = this.address ? this.address : this.get();
                  }
                  return obj;
              }
              break;
            case type_uniform:
              obj.get = function () {
                return shader_util.getUniformLocation(this.program, this.name);
              };
              switch (type) {
                case type_float:
                  obj.num ? 0 : obj.num = 1;
                case type_int:
                  obj.num ? 0 : obj.num = 1;
                case type_bool:
                  obj.num ? 0 : obj.num = 1;
                  obj.value = function (val) {
                    this.address = this.address ? this.address : this.get();
                    shader_util.uniform1f(this.address, val);
                  }
                  return obj;
                case type_vec2:
                  obj.num ? 0 : obj.num = 2;
                case type_vec3:
                  obj.num ? 0 : obj.num = 3;
                case type_vec4:
                  obj.num ? 0 : obj.num = 4;
                  obj.value = function (val, val1, val2, val3) {
                    this.address = this.address ? this.address : this.get();
                    if (util.reType(val).indexOf("Array") != -1) {
                      switch (val.length) {
                        case 1:
                          shader_util.uniform1fv(this.address, val);
                          break;
                        case 2:
                          shader_util.uniform2fv(this.address, val);
                          break;
                        case 3:
                          shader_util.uniform3fv(this.address, val);
                          break;
                        case 4:
                          shader_util.uniform4fv(this.address, val);
                          break;
                      }
                    } else {
                      switch (arguments.length) {
                        case 1:
                          shader_util.uniform1f(this.address, val);
                          break;
                        case 2:
                          shader_util.uniform2f(this.address, val, val1);
                          break;
                        case 3:
                          shader_util.uniform3f(this.address, val, val1, val2);
                          break;
                        case 4:
                          shader_util.uniform4f(this.address, val, val1, val2, val3);
                          break;
                      }
                    }
                  };
                  return obj;
                case type_mat2:
                  obj.num ? 0 : obj.num = 2;
                case type_mat3:
                  obj.num ? 0 : obj.num = 3;
                case type_mat4:
                  obj.num ? 0 : obj.num = 4;
                  obj.value = function (val) {
                    this.address = this.address ? this.address : this.get();
                    switch (val.length) {
                      case 8:
                        shader_util.uniformMatrix2fv(this.address, val);
                        break;
                      case 12:
                        shader_util.uniformMatrix3fv(this.address, val);
                        break;
                      case 16:
                        shader_util.uniformMatrix4fv(this.address, val);
                        break;
                    }
                  };
                  return obj;
              }
              break;
          }
        }

        //拼接创建制定shader指定类型的变量
        function typeCreat (name, initVal, type, callback) {
          let typeStr = "";
          switch (type) {
            case type_vec4:
              typeStr = "vec4";
              break;
            case type_mat4:
              typeStr = "mat4";
              break;
            case type_float:
              typeStr = "float";
              break;
            case type_int:
              typeStr = "int";
              break;
            case type_bool:
              typeStr = "bool";
              break;
            case type_const:
              typeStr = "const";
              break;
            case type_vec2:
              typeStr = "vec2";
              break;
            case type_vec3:
              typeStr = "vec3";
              break;
            case type_mat2:
              typeStr = "mat2";
              break;
            case type_mat3:
              typeStr = "mat3";
              break;
          }
          let l = 0;
          let nameArray = [];
          //储存限定符
          let save = saveArray[saveFlg] + " ";
          if (util.reType(name, "array")) {
            l = name.length;
            nameArray = name;
          } else {
            l = 1;
            nameArray[0] = name;
          }
          let call;
          if (!(util.reType(initVal, "undefined"))) {
            if (!(util.reType(callback, "undefined"))) {
              call = callback;
            } else {
              if (util.reType(initVal, "array")) {
                call = function (initVal, i) {
                  line += "=" + initVal[i] + ";\n";
                };
              } else {
                call = function (initVal, i) {
                  line += "=" + initVal + ";\n";
                };
              }
            }
          } else {
            call = function (initVal, i) {
              line += ";\n";
            };
          }

          for (let i = 0; i < l; ++i) {
            let n = nameArray[i];
            line += save + typeStr + " " + n;
            call(initVal, i, typeStr);
            if (saveFlg === type_attribute || saveFlg === type_uniform) {
              baseShader.reShader[n] = createFunc(type, n);
            }
          }
        }

        function callbackVecMat (initVal, i, typeStr) {
          line += "= " + typeStr + "(";
          let re = /\d/;
          let l = Number(re.exec(typeStr));
          if (util.reType(initVal[0], "array")) {
            // let l = initVal[i].length;
            let j = 0;
            while (1) {
              line += initVal[i][j] === undefined ? "0.0" : initVal[i][j];
              if (j < l - 1) {
                line += ",";
              } else {
                break;
              }
              ++j;
            }
            line += ");\n";
          } else {
            // let l = initVal.length;
            let j = 0;
            while (1) {
              line += initVal[j] === undefined ? "0.0" : initVal[j];
              if (j < l - 1) {
                line += ",";
              } else {
                break;
              }
              ++j;
            }
            line += ");\n";
          }
        }

        return {
          setSource: function (s) {
            source = s;
          },
          setLine: function (type) {
            line = "";
            line += tab + type;
          },
          struct: function () {

          },
          attribute: function () {
            saveFlg = type_attribute;
          },
          uniform: function () {
            saveFlg = type_uniform;
          },
          varying: function () {
            saveFlg = type_varying;
          },
          const: function () {
            saveFlg = type_const;
          },
          array: function () {

          },
          //name float变量名可以为数组 initVal初期值
          float: function (name, initVal) {
            typeCreat(name, initVal, type_float);
            addSource();
          },
          int: function (name, initVal) {
            typeCreat(name, initVal, type_int);
            addSource();
          },
          bool: function (name) {

          },
          //vec2,vec3,vec4
          vec4: function (name, initVal) {
            typeCreat(name, initVal, type_vec4, callbackVecMat);
            addSource();
          },
          vec3: function (name, initVal) {
            typeCreat(name, initVal, type_vec3, callbackVecMat);
            addSource();
          },
          vec2: function (name, initVal) {
            typeCreat(name, initVal, type_vec2, callbackVecMat);
            addSource();
          },
          //矩阵 mat2,mat3,mat4
          mat4: function (name, initVal) {
            typeCreat(name, initVal, type_mat4, callbackVecMat);
            addSource();
          },
          mat3: function (name, initVal) {
            typeCreat(name, initVal, type_mat3, callbackVecMat);
            addSource();
          },
          mat2: function (name, initVal) {
            typeCreat(name, initVal, type_mat2, callbackVecMat);
            addSource();
          },
          //单条语句
          $: function (ln) {
            ln = tab + ln + ";\n";
            source.source += ln;
          },
          funcStart: function (name, args) {
            line += name + "( ";
            if (!util.reType(args, "undefined")) {
              let l = args.length;
              for (let i = 1; i < l; ++i) {
                line += args[i] + ",";
              }
            }
            line = line.substr(0, line.length - 1) + "){\n";
            source.source += line;
            line = "";
            tab += "\t";
          },
          funcEnd: function () {
            tab = tab.substr(0, tab.length - 1);
            source.source += tab + "}\n";
          },
          for: function () {

          },
          if: function () {

          },
          else: function () {

          },
          //预编译
          precompile: function (ln) {
            ln = tab + ln + "\n";
            source.source += ln;
          }
        }
      })();
      //buffer
      /**
       * shader内buffer与变量进行传递
       * @param buffer buffer对象
       * @param index shader内变量
      */
      let byfferCopyTo = function (element, stride, offset, num, type, normalized) {
        let buffer = this;
        buffer.bindBuffer();
        let a = element.get();
        shader_util.vertexAttribPointer(a, num || element.num, type || element.type, normalized || false, stride ? buffer.FSIZE * stride : 0, offset ? buffer.FSIZE * offset : 0);
        shader_util.enableVertexAttribArray(a);
      }
      /**
       * 缓冲区数据去向
       * @param buffername buffer对象
       * @param how 如何赋值 如果是 array 进行多组赋值，否则赋值一组
       * how: {
       *        start:
       *         end:
       *         to:
       *         type:默认 element.type
       *         normalized:默认 false   
       *         group:  为一组时 group = end 多组时由第一组指定多少数据为一组
       *      }
       */
      let bufferEasyToArr = function (how) {
        let buffer = this;
        buffer.bindBuffer();
        let group = how[0].group * buffer.FSIZE;
        let l = how.length;
        for (let i = 0; i < l; ++i) {
          let member = how[i];
          let element = member.to;
          let start = member.start - 1;
          start = start ? start * buffer.FSIZE : 0;
          let num = member.end - member.start + 1;
          let type = member.type || element.type;
          let normalized = member.normalized || false;
          let location = element.get();

          shader_util.vertexAttribPointer(location, num, type, normalized, group, start);
          shader_util.enableVertexAttribArray(location);
        }
        how = null;
      }

      let bufferEasyToUnArr = function (how) {
        let buffer = this
        buffer.bindBuffer();

        let element = how.to;
        let num = how.end - how.start + 1;
        let type = how.type || element.type;
        let normalized = how.normalized || false;
        let location = element.get();

        shader_util.vertexAttribPointer(location, num, type, normalized, 0, 0);
        shader_util.enableVertexAttribArray(location);

        how = null;
      }

      /**
       * 纹理
       */


      return {
        init: function () {
          gl3 = config.get_gl3();
        },
        create: function () {
          //console.log(baseShader.shaderFsource.source);
          //console.log(baseShader.shaderVsource.source);

          baseShader.program = shader_util.createProgram(shader_util.loadShader("v", baseShader.shaderVsource.source), shader_util.loadShader("f", baseShader.shaderFsource.source));
          baseShader.setProgram();
          let obj = Object.create(baseShader.reShader);
          obj.fSource = baseShader.shaderFsource.source;
          obj.vSource = baseShader.shaderVsource.source;
          obj.program = baseShader.program;
          /**
           * 创建一个buffer
           * @param type 0：array，1：element，2：rander，3：frame 默认缺省为array
           */
          obj.buffer = function (type) {
            let reObj = {};
            let createBuffer = shader_util.createBuffer;
            switch (type) {
              case 1:
              case "element":
                reObj.type = gl3.ELEMENT_ARRAY_BUFFER;
                reObj.bindBuffer = function () {
                  shader_util.bindBuffer(this.type, this.buffer);
                }
                break
              case 0:
              case "array":
                reObj.type = gl3.ARRAY_BUFFER;
                reObj.bindBuffer = function () {
                  shader_util.bindBuffer(this.type, this.buffer);
                }
                break
              case 2:
              case "rander":
                createBuffer = shader_util.createRenderbuffer;
                reObj.type = gl3.RENDERBUFFER;
                reObj.bindBuffer = function () {
                  shader_util.bindRenderbuffer(this.type, this.buffer);
                }
                break
              case 3:
              case "frame":
                createBuffer = shader_util.createFramebuffer;
                reObj.type = gl3.FRAMEBUFFER;
                reObj.bindBuffer = function () {
                  shader_util.bindFramebuffer(this.type, this.buffer);
                }
                break;
              default:
                reObj.type = gl3.ARRAY_BUFFER;
                reObj.bindBuffer = function () {
                  shader_util.bindBuffer(this.type, this.buffer);
                }
                break;
            }

            reObj.buffer = createBuffer();
            //根据版本不同装载不同函数
            if (gl3.version === 1) {
              //data 数据 usage用法用于优化 不指定默认gl3.STATIC_DRAW
              reObj.load = function (data, usage) {
                this.bindBuffer();
                shader_util.bufferData1(this.type, data, usage || gl3.STATIC_DRAW)
                this.FSIZE = data.BYTES_PER_ELEMENT;
                return this;
              }
            } else {
              // reObj.load = function (data) {
              //   shader_util.bindBuffer(gl3.ARRAY_BUFFER, this.buffer);
              //   shader_util.bufferData2()
              //   return this;
              // }
            }

            reObj.copyTo = byfferCopyTo;
            reObj.arrEasyTo = bufferEasyToArr;
            reObj.easyTo = bufferEasyToUnArr;
            return reObj;
          }
          /**
           * 使用本shader的program
           */
          obj.use = function () {
            shader_util.useProgram(this.program);
            return this;
          };
          obj.use();
          obj.gl3 = gl3;
          init();
          return obj;
        },
        shaderV: function () {
          //判断需要返回的shader对象是否创建
          if (util.reType(baseShader.reShader, "undefined")) {
            baseShader.reShader = {};
          }
          edit.setSource(baseShader.shaderVsource);
          return this;
        },
        shaderF: function () {
          //判断需要返回的shader对象是否创建
          if (util.reType(baseShader.reShader, "undefined")) {
            baseShader.reShader = {};
          }
          edit.setSource(baseShader.shaderFsource);
          return this;
        },
        attribute: function () {
          edit.attribute();
          return this;
        },
        uniform: function () {
          edit.uniform();
          return this;
        },
        varying: function () {
          edit.varying();
          return this;
        },
        const: function () {
          edit.const();
          return this;
        },
        array: function () {

        },
        void: function () {
          edit.setLine("void ");
          return this;
        },
        //name float变量名可以为数组 init初期值
        float: function (name, initVal) {
          if (util.reType(name, "undefined")) {
            edit.setLine("float ");
          } else {
            edit.float(name, initVal);
          }
          return this;
        },
        int: function (name, initVal) {
          if (util.reType(name, "undefined")) {
            edit.setLine("int ");
          } else {
            edit.int(name, initVal);
          }
          return this;
        },
        bool: function (name, initVal) {
          if (util.reType(name, "undefined")) {
            edit.setLine("bool ");
          } else {
            edit.bool(name, initVal);
          }
          return this;
        },
        //vec2,vec3,vec4
        vec4: function (name, initVal) {
          if (util.reType(name, "undefined")) {
            edit.setLine("vec4 ");
          } else {
            edit.vec4(name, initVal);
          }
          return this;
        },
        vec3: function (name, initVal) {
          if (util.reType(name, "undefined")) {
            edit.setLine("vec3 ");
          } else {
            edit.vec3(name, initVal);
          }

          return this;
        },
        vec2: function (name, initVal) {
          if (util.reType(name, "undefined")) {
            edit.setLine("vec2 ");
          } else {
            edit.vec2(name, initVal);
          }

          return this;
        },
        //矩阵 mat2,mat3,mat4
        mat4: function (name, initVal) {
          if (util.reType(name, "undefined")) {
            edit.setLine("mat4 ");
          } else {
            edit.mat4(name, initVal);
          }

          return this;
        },
        mat3: function (name, initVal) {
          if (util.reType(name, "undefined")) {
            edit.setLine("mat3 ");
          } else {
            edit.mat3(name, initVal);
          }

          return this;
        },
        mat2: function (name, initVal) {
          if (util.reType(name, "undefined")) {
            edit.setLine("mat2 ");
          } else {
            edit.mat2(name, initVal);
          }

          return this;
        },
        $: function (ln) {
          edit.$(ln);
          return this;
        },
        precompile: function (ln) {
          edit.precompile(ln);
          return this;
        },
        funcStart: function (name) {
          edit.funcStart(name, arguments);
          return this;
        },
        funcEnd: function () {
          edit.funcEnd();
          return this;
        },
        for: function () {

        },
        if: function () {

        },
        else: function () {

        },
        callback: function () {

        },


      }
    })();
    //矩阵
    let matrix = (function () {
      // 0  4  8  12
      // 1  5  9  13
      // 2  6  10 14
      // 3  7  11 15
      let baseMatrix = {
        __cloneM4: function () {
          let a = this._elements;
          let b = new Float32Array(16);
          let i = 16;
          while (i) {
            --i;
            b[i] = a[i];
          }
          return b;
        },
        /**
         * 观察矩阵
         * @param {*} eyeX 视点
         * @param {*} eyeY 视点
         * @param {*} eyeZ 视点
         * @param {*} centerX 观察点
         * @param {*} centerY 观察点
         * @param {*} centerZ 观察点
         * @param {*} upX 上方向
         * @param {*} upY 上方向
         * @param {*} upZ 上方向
         */
        __setLookAt: function (eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
          let e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;

          eyeX = -eyeX;
          eyeY = -eyeY;
          eyeZ = -eyeZ;

          fx = centerX + eyeX;
          fy = centerY + eyeY;
          fz = centerZ + eyeZ;

          rlf = 1 / Math.sqrt(fx * fx + fy * fy + fz * fz);
          fx *= rlf;
          fy *= rlf;
          fz *= rlf;

          sx = fy * upZ - fz * upY;
          sy = fz * upX - fx * upZ;
          sz = fx * upY - fy * upX;

          rls = 1 / Math.sqrt(sx * sx + sy * sy + sz * sz);
          sx *= rls;
          sy *= rls;
          sz *= rls;

          ux = sy * fz - sz * fy;
          uy = sz * fx - sx * fz;
          uz = sx * fy - sy * fx;

          e = this._elements;
          e[0] = sx;
          e[1] = ux;
          e[2] = -fx;
          e[3] = 0;

          e[4] = sy;
          e[5] = uy;
          e[6] = -fy;
          e[7] = 0;

          e[8] = sz;
          e[9] = uz;
          e[10] = -fz;
          e[11] = 0;

          e[12] = 0;
          e[13] = 0;
          e[14] = 0;
          e[15] = 1;

          e[12] += e[0] * eyeX + e[4] * eyeY + e[8] * eyeZ;
          e[13] += e[1] * eyeX + e[5] * eyeY + e[9] * eyeZ;
          e[14] += e[2] * eyeX + e[6] * eyeY + e[10] * eyeZ;
          e[15] += e[3] * eyeX + e[7] * eyeY + e[11] * eyeZ;

          return this;
        },
        /**
         * 透视投影
         * @param {*} fovy 垂直视角
         * @param {*} aspect 裁剪面宽高比
         * @param {*} near 近裁剪面
         * @param {*} far 远裁剪面
         */
        __setPerspective: function (fovy, aspect, near, far) {
          let e, rd, s, ct;

          if (near === far || aspect === 0) {
            util.error(msg.m10);
          }
          if (near <= 0) {
            util.error(msg.m11);
          }
          if (far <= 0) {
            util.error(msg.m12);
          }

          fovy = Math.PI * fovy / 180 / 2;
          s = Math.sin(fovy);
          if (s === 0) {
            util.error(msg.m10);
          }

          rd = 1 / (far - near);
          ct = Math.cos(fovy) / s;

          e = this._elements;

          e[0] = ct / aspect;
          e[1] = 0;
          e[2] = 0;
          e[3] = 0;

          e[4] = 0;
          e[5] = ct;
          e[6] = 0;
          e[7] = 0;

          e[8] = 0;
          e[9] = 0;
          e[10] = -(far + near) * rd;
          e[11] = -1;

          e[12] = 0;
          e[13] = 0;
          e[14] = -2 * near * far * rd;
          e[15] = 0;

          return this;
        },
        /**
         * 正射投影
         */
        __setOrtho: function () {

        },
        /**
         * 再平移
         * @param {int} x x轴移动距离
         * @param {int} y y轴移动距离
         * @param {int} z z轴移动距离
         */
        __move: function (x, y, z) {
          let m = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
          this.__mulM4(this._elements, m);
          return this;
        },
        __zoom: function () {
        },
        /**
         * 再旋转
         * @param {int} a 旋转角度
         * @param {1/0} x 旋转轴
         * @param {1/0} y 旋转轴
         * @param {1/0} z 旋转轴
         */
        __rotate: function (a, x, y, z) {
          let c = this.__clone();
          this.__setRotate(a, x, y, z);
          let b = this.__clone();
          this.__mulM4(c, b);
          return this;
        },
        /**
         * 重新设置一个平移矩阵
         * @param {int} x x轴移动距离
         * @param {int} y y轴移动距离
         * @param {int} z z轴移动距离
         */
        __setMove: function (x, y, z) {
          let m = this._elements;

          m[0] = 1;
          m[1] = 0;
          m[2] = 0;
          m[3] = 0;

          m[4] = 0;
          m[5] = 1;
          m[6] = 0;
          m[7] = 0;

          m[8] = 0;
          m[9] = 0;
          m[10] = 1;
          m[11] = 0;

          m[12] = x;
          m[13] = y;
          m[14] = z;
          m[15] = 1;

          return this;
        },

        __setZoom: function () {

        },
        /**
         * 重新设置一个旋转矩阵
         * @param {int} a 旋转角度
         * @param {1/0} x 旋转轴
         * @param {1/0} y 旋转轴
         * @param {1/0} z 旋转轴
         */
        __setRotate: function (a, x, y, z) {

          let e, s, c, len, rlen, nc, xy, yz, zx, xs, ys, zs;

          a = Math.PI * a / 180;
          e = this._elements;

          s = Math.sin(a);
          c = Math.cos(a);

          if (0 !== x && 0 === y && 0 === z) {
            if (x < 0) {
              s = -s;
            }
            e[0] = 1; e[4] = 0; e[8] = 0; e[12] = 0;
            e[1] = 0; e[5] = c; e[9] = -s; e[13] = 0;
            e[2] = 0; e[6] = s; e[10] = c; e[14] = 0;
            e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
          } else if (0 === x && 0 !== y && 0 === z) {
            if (y < 0) {
              s = -s;
            }
            e[0] = c; e[4] = 0; e[8] = s; e[12] = 0;
            e[1] = 0; e[5] = 1; e[9] = 0; e[13] = 0;
            e[2] = -s; e[6] = 0; e[10] = c; e[14] = 0;
            e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
          } else if (0 === x && 0 === y && 0 !== z) {
            if (z < 0) {
              s = -s;
            }
            e[0] = c; e[4] = -s; e[8] = 0; e[12] = 0;
            e[1] = s; e[5] = c; e[9] = 0; e[13] = 0;
            e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
            e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
          } else {
            len = Math.sqrt(x * x + y * y + z * z);
            if (len !== 1) {
              rlen = 1 / len;
              x *= rlen;
              y *= rlen;
              z *= rlen;
            }
            nc = 1 - c;
            xy = x * y;
            yz = y * z;
            zx = z * x;
            xs = x * s;
            ys = y * s;
            zs = z * s;

            e[0] = x * x * nc + c;
            e[1] = xy * nc + zs;
            e[2] = zx * nc - ys;
            e[3] = 0;

            e[4] = xy * nc - zs;
            e[5] = y * y * nc + c;
            e[6] = yz * nc + xs;
            e[7] = 0;

            e[8] = zx * nc + ys;
            e[9] = yz * nc - xs;
            e[10] = z * z * nc + c;
            e[11] = 0;

            e[12] = 0;
            e[13] = 0;
            e[14] = 0;
            e[15] = 1;
          }

          return this;
        },

        /**
         * 自身右乘矩阵
         * @param {matrix} o 
         */
        __mulM4: function (a, b) {
          let r = this._elements;

          r[0] = a[0] * b[0] + a[4] * b[1] + a[8] * b[2] + a[12] * b[3];
          r[1] = a[1] * b[0] + a[5] * b[1] + a[9] * b[2] + a[13] * b[3];
          r[2] = a[2] * b[0] + a[6] * b[1] + a[10] * b[2] + a[14] * b[3];
          r[3] = a[3] * b[0] + a[7] * b[1] + a[11] * b[2] + a[15] * b[3];

          r[4] = a[0] * b[4] + a[4] * b[5] + a[8] * b[6] + a[12] * b[7];
          r[5] = a[1] * b[4] + a[5] * b[5] + a[9] * b[6] + a[13] * b[7];
          r[6] = a[2] * b[4] + a[6] * b[5] + a[10] * b[6] + a[14] * b[7];
          r[7] = a[3] * b[4] + a[7] * b[5] + a[11] * b[6] + a[15] * b[7];

          r[8] = a[0] * b[8] + a[4] * b[9] + a[8] * b[10] + a[12] * b[11];
          r[9] = a[1] * b[8] + a[5] * b[9] + a[9] * b[10] + a[13] * b[11];
          r[10] = a[2] * b[8] + a[6] * b[9] + a[10] * b[10] + a[14] * b[11];
          r[11] = a[3] * b[8] + a[7] * b[9] + a[11] * b[10] + a[15] * b[11];

          r[12] = a[0] * b[12] + a[4] * b[13] + a[8] * b[14] + a[12] * b[15];
          r[13] = a[1] * b[12] + a[5] * b[13] + a[9] * b[14] + a[13] * b[15];
          r[14] = a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14] * b[15];
          r[15] = a[3] * b[12] + a[7] * b[13] + a[11] * b[14] + a[15] * b[15];

          return this;
        },
        /*******************************vec4**********************************/
        __cloneVec4: function () {
          let a = this._elements;
          let b = new Float32Array(4);
          let i = 4;
          while (i) {
            --i;
            b[i] = a[i];
          }
          return b;
        },
        //vec4vec4To变换为vec3
        /**
         * ｛
         *    x:
         *    y:
         *    z:
         * ｝
         */
        __vec4ToVec3: function () {
          let v = this._elements;

          let vx = v[0];
          let vy = v[1];
          let vz = v[2];
          let vw = v[3];

          return {
            x: vx / vw,
            y: vy / vw,
            z: vz / vw,
          }
        },
        //点乘
        __pointMul: function () {
          //叉乘
        },
        __forkMul: function () {
          //矩阵vec3相乘
        },
        __mulM4Vec4: function (m, v) {
          let r = this._elements;

          let vx = v[0];
          let vy = v[1];
          let vz = v[2];
          let vw = v[3];

          r[0] = m[0] * vx + m[4] * vy + m[8] * vz + m[12] * vw;
          r[1] = m[1] * vx + m[5] * vy + m[9] * vz + m[13] * vw;
          r[2] = m[2] * vx + m[6] * vy + m[10] * vz + m[14] * vw;
          r[3] = m[3] * vx + m[7] * vy + m[11] * vz + m[15] * vw;

          return this;
        },
        /***************************************/
        __cloneVec3: function () {
          let a = this._elements;
          let b = new Float32Array(3);
          let i = 3;
          while (i) {
            --i;
            b[i] = a[i];
          }
          return b;
        },
        /**
         * 归一化
         */
        __vec3Normalize: function () {
          var v = this._elements;
          var c = v[0], d = v[1], e = v[2], g = Math.sqrt(c * c + d * d + e * e);
          if (g) {
            if (g == 1)
              return this;
          } else {
            v[0] = 0; v[1] = 0; v[2] = 0;
            return this;
          }
          g = 1 / g;
          v[0] = c * g; v[1] = d * g; v[2] = e * g;
          return this;
        },

      }

      function arrayCheck (a) {
        if (util.reType(a, "array")) {
          1
          return true;
        } else {
          return false;
        }
      }

      return {
        /**
         * 4x4矩阵
         */
        createM4: function (a) {
          let o = Object.create(null);

          if (a) {
            o._elements = new Float32Array(a);
          } else {
            o._elements = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
          }

          o.__clone = baseMatrix.__cloneM4;
          o.__setLookAt = baseMatrix.__setLookAt;
          o.__setPerspective = baseMatrix.__setPerspective;
          o.__setOrtho = baseMatrix.__setOrtho;
          //平移
          o.__move = baseMatrix.__move;
          //缩放
          o.__zoom = baseMatrix.__zoom;
          //旋转
          o.__rotate = baseMatrix.__rotate;
          //设置平移
          o.__setMove = baseMatrix.__setMove;
          //设置缩放
          o.__setZoom = baseMatrix.__setZoom;
          //设置旋转
          o.__setRotate = baseMatrix.__setRotate;
          //右乘
          o.__mulM4 = baseMatrix.__mulM4;

          return o;
        },
        /**
         * vector 向量
         */
        createVec4: function (a) {
          let o = Object.create(null);

          if (a) {
            o._elements = new Float32Array(a);
          } else {
            o._elements = new Float32Array([0, 0, 0, 0]);
          }

          o.__clone = baseMatrix.__cloneVec4;
          //返回一个Vec3
          o.__vec4ToVec3 = baseMatrix.__vec4ToVec3;
          //点乘
          o.__pointMul = baseMatrix.__pointMul;
          //x乘
          o.__forkMul = baseMatrix.__forkMul;
          //矩阵vec3相乘
          o.__mulM4Vec4 = baseMatrix.__mulM4Vec4;

          return o;
        },
        /**
         * 创建vec3
         */
        createVec3: function (a) {
          let o = Object.create(null);

          if (a) {
            o._elements = new Float32Array(a);
          } else {
            o._elements = new Float32Array([0, 0, 0]);
          }

          o.__clone = baseMatrix.__cloneVec3;
          //归一化
          o.__normalize = baseMatrix.__vec3Normalize;

          return o;
        },
      }
    })();
    //物理相关
    let phy = (function () {
      //创建立方体碰撞盒
      function createByCube (o, length, width, height) {
        //碰撞
        let collision = Object.create(null);

        collision._max = Math.sqrt(Math.pow(length / 2, 2) + Math.pow(width / 2, 2) + Math.pow(height / 2, 2))
        collision._min = Math.min(Math.min(length / 2, width / 2), height / 2)


        //_modelMatrix
        o._collision = collision;
      };
      //创建球体碰撞盒
      function createBySphere (o, radius) {

      };

      return {
        _phyArr: [],
        //当前已经移除物理计算的obj在phyArr中的indexArr是什么
        _nullObjIndexArr: [],
        //当前需要物理计算的obj个数
        set _ObjNum (x) { _ObjNum = x },
        get _ObjNum () { return this._phyArr.length - this._nullObjIndexArr.length; },
        //当前已经移除物理计算的obj个数
        set _nullObjNum (x) { _nullObjNum = x },
        get _nullObjNum () { return this._nullObjIndexArr.length; },
        //追加一个物理计算对象
        __add: function (phyAttribute) {
          this._phyArr.push(phyAttribute);
        },
        /**
         * 创建碰撞对象
         * 
         * obj 以obj的xyz坐标对象作为中心 
         * quality 物体质量 kg
         * type 碰撞盒类型 立方体：cube  球体：sphere
         * 碰撞坐标数组v
         * 立方体 v=｛
         *            长 length v[0]
         *            宽 width v[1]
         *            高 height v[2]
         *            ｝
         * 球体 v={
         *      半径 radius v[0]
         *      }
         * 
         * 
         */
        __create: function (obj, quality, type, v) {
          let o = {
            //所属对象
            _target: obj,
            //状态 0静止 1运动
            _static: 0,
            //力
            _force: matrix.createVec4(),
            //质量
            _quality: quality,
            _clock: util.clock(),
            _time: 0
          };

          switch (type) {
            case "cube":
              createByCube(o, v[0], v[1], v[2]);
            case "sphere":
              createBySphere(o, v[0]);
          }

          obj._phyAttribute = o;
        },
        __run: function () {
          //碰撞池
          let collisionPool = [];
          let u = util;
          let AB距离;
          let targetA;
          let targetB;
          let phyAttribute = null;
          let compareObj = null;
          let i = this._ObjNum;
          let phyArr = this._phyArr;
          let j;

          while (i) {
            --i;
            phyAttribute = phyArr[i];
            targetA = phyAttribute._target;
            j = i;
            while (j) {
              --j;
              compareObj = phyArr[j];
              targetB = compareObj._target;

              AB距离 = u.getDistance(targetA._xyz, targetB._xyz);

              //if (AB距离 < phyAttribute._collision._max + compareObj._collision._max){
              if (AB距离 < phyAttribute._collision._min + compareObj._collision._min) {
                let collisionObj = {
                  source: targetA,
                  target: targetB,
                  distance: AB距离
                }
                collisionPool.push(collisionObj);
              }
            }
          }


          let collisionObj = collisionPool.pop();
          while (collisionObj) {
            targetA = collisionObj.source;
            targetB = collisionObj.target;

            targetA._xyz._wx += 0.03;
            //targetB._xyz._wx -= 0.03;

            collisionObj = collisionPool.pop();
          }

        },
        __clear: function () {

        },
      };
    })();
    //物体基类
    let baseObj = (function () {
      let base = {
        __addFace: function (faceObj) {
          faceObj._modelMatrix = this._modelMatrix
          this._faceArr.push(faceObj);
        },

        __defaultLogic: function () {
          let faceArr = this._faceArr;
          let renderArr = this._renderArr;
          let i = faceArr.length;
          while (i) {
            --i
            renderArr.push(faceArr[i])
          }
        },
      }


      return {
        create: function (type) {
          let o = {};
          o._phy = phy;
          o._phyAttribute = null;
          o._control = control;
          o._render = render;
          o._renderArr = render.gerRenderArr();
          o._audio = audio;
          o._shader = shader;
          o._xyz = xyz.create();
          o._util = util;
          o._face = face;
          o._matrix = matrix;
          o.__logic = () => { };
          switch (type) {
            //基本对象
            case dbc_type_baseObj:
              //模型矩阵
              let m4 = matrix.createM4();
              let m = matrix.createM4().__setMove(0, 0, 0);
              let r = matrix.createM4().__setRotate(0, 1, 0, 0);

              o._modelMatrix = {
                _that: o,
                _m4: m4,
                _move: m,
                _rotate: r,
                __elements: m4.__mulM4(m._elements, r._elements)._elements,
                set _elements (a) { },
                get _elements () {
                  let changeFlg = false;
                  let m4 = this._m4;
                  let xyz = this._that._xyz;
                  let move = this._move;
                  let rotate = this._rotate;

                  if (xyz._wChangeFlg) {
                    move.__setMove(xyz._fx, xyz._fy, xyz._fz);
                    changeFlg = true;
                  }

                  let flgx = xyz._rxChangeFlg;
                  let flgy = xyz._ryChangeFlg;
                  let flgz = xyz._rzChangeFlg;

                  if (flgx || flgy || flgz) {
                    rotate._elements = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
                    if (flgx) {
                      rotate.__rotate(xyz._rx, 1, 0, 0);
                    }

                    if (flgy) {
                      rotate.__rotate(xyz._ry, 0, 1, 0);
                    }

                    if (flgz) {
                      rotate.__rotate(xyz._rz, 0, 0, 1);
                    }

                    changeFlg = true;
                  }
                  if (changeFlg) {
                    m4.__mulM4(move._elements, rotate._elements);
                  }
                  return this.__elements;
                },

              };
              m4 = null;
              m = null;
              r = null;
              //face 数组
              o._faceArr = [];
              //添加 face
              o.__addFace = base.__addFace;
              /**
               * 默认逻辑 把对象所包含的face加载进_renderArr
               */
              o.__defaultLogic = base.__defaultLogic;
              break;
            case dbc_type_combinant:
              break;
            case dbc_type_middle:
              break;
            default:
              util.error(msg.m9);
          }
          return o;
        },
      }
    })();
    //音频
    let audio = (function () {

    })();
    let camera = (function () {
      let baseCamera = {
        __update: function () {
          let mvpMatrix = this._mvpMatrix;
          mvpMatrix.__mulM4(this._projection._elements, this._lookAt._elements)

          let arr = this._shaderFuncArr;
          for (let i = 0, l = arr.length; i < l; ++i) {
            arr[i](mvpMatrix._elements);
          }
        },
        __defaultLogic: function () {
          if (this._updateFlg) {
            this.__update();
            this._updateFlg = false;
          }
        }
      }
      return {
        create: function () {
          let o = Object.create(null);
          //投影
          o._projection = matrix.createM4();
          //观察
          o._lookAt = matrix.createM4();

          o._mvpMatrix = matrix.createM4();

          o._shaderFuncArr = [];

          o._control = control;

          o._matrix = matrix;

          o.__logic = null;

          o._updateFlg = true;

          o.__update = baseCamera.__update;

          o.__defaultLogic = baseCamera.__defaultLogic;

          //纵横比
          o.__aspectRatio = config.get_aspectRatio();

          o._wx = 0;
          o._wy = 0;
          o._wz = 0;
          //绑定
          o._bind = { _xyz: xyz.create() };
          return o;
        },
      }
    })();
    //渲染
    let render = (function () {
      let gl3;
      let requestAnimationFrame = config.get_requestAnimationFrame();
      let cancelAnimationFrame = config.get_cancelAnimationFrame();
      let id = 0;
      let renderArr = [];
      let renderCamera = null;
      let renderPhy = phy;
      /*------------------fps------------------------------------------------------------*/
      let fps = 0;
      let calcFps = (function () {
        let clock = util.clock();
        let lastTime = clock.now();
        let num = 0;

        return function () {
          let nowTime = clock.now();
          if (nowTime - lastTime > 1000) {
            console.log("FPS:" + num);
            fps = num;
            num = 0;
            lastTime = nowTime;
          } else {
            num += 1;
          }
        };
      })();
      /*------------------fps------------------------------------------------------------*/
      function close () {
        cancelAnimationFrame(id);
      }

      function init (phyOpen) {
        gl3 = config.get_gl3();
        //默认背景色
        gl3.clearColor(0.0, 0.0, 0.0, 1.0);
        //默认开启深度检测
        gl3.enable(gl3.DEPTH_TEST);

        if (id) {
          close();
        }
        if (phyOpen) {
          id = requestAnimationFrame(render_callback_phy);
        } else {
          id = requestAnimationFrame(render_callback_no_phy);
        }

      }
      /**
       * 有碰撞检测
       */
      function render_callback_phy () {
        gl3.clear(gl3.COLOR_BUFFER_BIT | gl3.DEPTH_BUFFER_BIT);
        let next = render_header.__next;
        while (next) {
          next = next();
        }
        controlLinkList.get();
        //phy
        renderPhy.__run();
        //render
        let faceObj = renderArr.pop();
        while (faceObj) {
          faceObj.__draw();
          faceObj = renderArr.pop();
        }
        /*------------------fps-----------------------------------------------------------*/
        calcFps();
        /*------------------fps-----------------------------------------------------------*/
        id = requestAnimationFrame(render_callback_phy);
      }
      /**
       * 没有有碰撞检测
       */
      function render_callback_no_phy () {
        gl3.clear(gl3.COLOR_BUFFER_BIT | gl3.DEPTH_BUFFER_BIT);
        let next = render_header.__next;
        while (next) {
          next = next();
        }
        controlLinkList.get();
        //render
        let faceObj = renderArr.pop();
        while (faceObj) {
          faceObj.__draw();
          faceObj = renderArr.pop();
        }
        /*------------------fps-----------------------------------------------------------*/
        calcFps();
        /*------------------fps-----------------------------------------------------------*/
        id = requestAnimationFrame(render_callback_no_phy);
      }

      let render_header = {
        __next: 0
      };

      let start = function () {
        let that = controlLinkList.get();
        that.__logic();
        that.__defaultLogic();
        return that.__next;
      }

      let listNum = 1;
      let controlLinkList = Object.create(null);
      controlLinkList.header = {
        me: {
          control: () => 0
        },
      };
      controlLinkList.header.next = controlLinkList.header;
      controlLinkList.next = controlLinkList.header;
      controlLinkList.get = function () {
        let next = controlLinkList.next;
        controlLinkList.next = next.next;
        return controlLinkList.next.me;
      }
      //最后一个对象
      let theLast = null;

      return {
        /**
         * 
         * @param {int} phyOpen 是否开启
         */
        init: function (phyOpen = 0) {
          init(phyOpen);
        },
        close: function () {
          close();
        },
        first_link: function (obj) {
          let render_header_ = render_header;
          obj.__next = render_header_.__next;
          obj.__before = render_header_;

          render_header_.__next = function () {
            return start;
          };
          theLast = obj;
          let controlLinkList_ = controlLinkList;
          let o = Object.create(null);
          o.before = controlLinkList_.header;
          o.me = obj;
          o.next = controlLinkList_.header.next;

          controlLinkList_[listNum] = o;
          controlLinkList_.header.next = o;
          obj.__listNum = listNum;
          listNum += 1;
        },
        link: function (objLeft, objRight) {
          if (objLeft.__listNum) {
            if (!objRight.__listNum) {
              objRight.__next = objLeft.__next;
              objRight.__before = objLeft;

              objLeft.__next = function () {
                return start;
              }
              if (objLeft === theLast) {
                theLast = objRight;
              }

              let controlLinkList_ = controlLinkList;
              let o = Object.create(null);
              let beforeObj = controlLinkList_[objLeft.__listNum];

              o.before = beforeObj;
              o.me = objRight;
              o.next = beforeObj.next;
              beforeObj.next = o;

              objRight.__listNum = listNum;
              controlLinkList_[listNum] = o;
              listNum += 1;
            } else {
              this.delete(objRight);
              this.link(objLeft, objRight);
            }
          } else {
            this.push(objLeft);
            this.link(objLeft, objRight);
          }
        },
        push: function (obj) {
          this.link(theLast, obj);
        },
        delete: function (obj) {
          let num = obj.__listNum;
          if (num) {
            let before = obj.__before;
            let next = obj.__next;
            before.__next = next;
            if (obj === theLast) {
              theLast = before;
            }

            let controlLinkList_ = controlLinkList;
            let o = controlLinkList_[num];
            before = o.before;
            next = o.next;
            before.next = next;
            next.before = before;

            controlLinkList_[num] = null;
            obj.__listNum = null;
          } else {
            util.error(msg.m8);
          }
        },
        fps: () => fps,
        gerRenderArr: () => renderArr,
        /**
         * 设置摄影机
         * @param {*} o camera对象
         */
        setCamera: function (o) {
          if (null === renderCamera) {
            render.first_link(o);
          } else {
            render.link(renderCamera, o);
            render.delete(renderCamera);
            o._shaderFuncArr = renderCamera._shaderFuncArr;
          }
          renderCamera = o;
        },
        getCamera: () => renderCamera,
      }
    })();
    //游戏逻辑类
    let game = (function () {

    })();
    //点
    let point = (function () {
      function toArray () {

      }
      function inArray () {

      }
      return {
        create: function (x = 0, y = 0, z = 0) {
          let o = Object.create(null);
          o.__type = dbc_type_point;
          o.__x = x;
          o.__y = y;
          o.__z = z;
          o.__toArray = toArray;
          o.__inArray = inArray;
          return o;
        },
      }
    })();
    //线  
    let line = (function () {

    })();
    //面
    let face = (function () {
      let 纯色平面shader = null;
      let 纯色平面shader_init = function (face_type) {
        let face_shader = null;
        face_shader = shader
          .shaderV()
          .attribute().vec4(["a_Position", "a_Color"])
          .uniform().mat4("u_MvpMatrix")
          .uniform().mat4("u_ViewMatrix")
          .varying().vec4("v_Color")
          .void().funcStart("main")
          .$("gl_Position = u_MvpMatrix * u_ViewMatrix * a_Position")
          .$("v_Color = a_Color")
          .funcEnd()
          .shaderF()
          .precompile("#ifdef GL_ES")
          .$("precision mediump float")
          .precompile("#endif")
          .varying().vec4("v_Color")
          .void().funcStart("main")
          .$("gl_FragColor = v_Color")
          .funcEnd()
          .create();
        let renderCamera = render.getCamera();
        //统一设置观察矩阵
        renderCamera._shaderFuncArr.push(function (m) {
          let s = 纯色平面shader;
          s.use();
          s.u_MvpMatrix.value(m);
        })
        纯色平面shader = face_shader;
        //防止多次创建 
        纯色平面shader_init = function (face_type) {
          return 纯色平面shader;
        }
        return face_shader;
      }
      let 纯色平面shader_load = function (data1, data2) {
        let _shader = this._shader;
        this.a_Position_Buffer = _shader.buffer();
        this.elebuffer = _shader.buffer("element");

        this.a_Position_Buffer.load(data1);
        this.elebuffer.load(data2);

        this._pointNum = data2.length;
      }
      let 纯色平面shader_draw = function () {
        let _shader = this._shader;
        let _gl3 = _shader.gl3;
        _shader.use();

        //把当前区域设置当前的 
        this.elebuffer.bindBuffer();

        this.a_Position_Buffer.bindBuffer();

        this.a_Position_Buffer.arrEasyTo([
          {
            start: 1,
            end: 3,
            to: _shader.a_Position,
            group: 6
          },
          {
            start: 4,
            end: 6,
            to: _shader.a_Color,
          }
        ]);

        _shader.u_ViewMatrix.value(this._modelMatrix._elements);
        _gl3.drawElements(_gl3.TRIANGLES, this._pointNum, _gl3.UNSIGNED_BYTE, 0);
      }

      let 漫反射平面shader = null;
      let 漫反射平面shader_init = function () {
        let face_shader = shader
          .shaderV()
          //顶点坐标 顶点颜色 法向量
          .attribute().vec4(["a_Position", "a_Color", "a_Normal"])
          //观察矩阵  mat4 不能传递数组
          .uniform().mat4("u_MvpMatrix")
          //模型矩阵 
          .uniform().mat4("u_ViewMatrix")
          //光照颜色 归一化的世界坐标
          .uniform().vec3(["u_LightColor", "u_LightDirection"])
          //varying
          .varying().vec4("v_Color")
          .void().funcStart("main")
          .$("gl_Position = u_MvpMatrix * u_ViewMatrix * a_Position")
          //归一化
          .$("vec3 normal = normalize(a_Normal.xyz)")
          .$("float nDotL = max(dot(u_LightDirection, normal),0.0)")
          .$("vec3 diffuse = u_LightColor * a_Color.rgb * nDotL")
          .$("v_Color = vec4(diffuse,a_Color.a)")
          .funcEnd()
          .shaderF()
          .precompile("#ifdef GL_ES")
          .$("precision mediump float")
          .precompile("#endif")
          .varying().vec4("v_Color")
          .void().funcStart("main")
          .$("gl_FragColor = v_Color")
          .funcEnd()
          .create();

        let renderCamera = render.getCamera();
        //统一设置观察矩阵
        renderCamera._shaderFuncArr.push(function (m) {
          let s = 漫反射平面shader;
          s.use();
          s.u_MvpMatrix.value(m);
        })
        漫反射平面shader = face_shader;
        //防止多次创建 
        漫反射平面shader_init = function (face_type) {
          return 漫反射平面shader;
        }
        return face_shader;
      }
      let 漫反射平面shader_load = function (data1, data2, data3, data4) {
        let _shader = this._shader;
        let a_Position_Buffer = _shader.buffer();
        let a_Color_Buffer = _shader.buffer();
        let a_Normal_Buffer = _shader.buffer();
        let elebuffer = _shader.buffer("element");

        a_Position_Buffer.load(data1);
        a_Color_Buffer.load(data2);
        a_Normal_Buffer.load(data3);
        elebuffer.load(data4);

        this.a_Position_Buffer = a_Position_Buffer;
        this.a_Color_Buffer = a_Color_Buffer;
        this.a_Normal_Buffer = a_Normal_Buffer;
        this.elebuffer = elebuffer;

        this._pointNum = data4.length;
      }
      let 漫反射平面shader_draw = function () {
        let _shader = this._shader;
        let _gl3 = _shader.gl3;
        let a_Position_Buffer = this.a_Position_Buffer;
        let a_Color_Buffer = this.a_Color_Buffer;
        let a_Normal_Buffer = this.a_Normal_Buffer;

        _shader.use();

        this.elebuffer.bindBuffer();

        a_Position_Buffer.bindBuffer();
        //单个使用 easyTo 而不是 arrEasyTo
        a_Position_Buffer.easyTo(
          {
            start: 1,
            end: 3,
            to: _shader.a_Position
          }
        );

        a_Color_Buffer.bindBuffer();
        a_Color_Buffer.easyTo(
          {
            start: 1,
            end: 3,
            to: _shader.a_Color
          }
        );

        a_Normal_Buffer.bindBuffer();
        a_Normal_Buffer.easyTo(
          {
            start: 1,
            end: 3,
            to: _shader.a_Normal
          }
        );

        _shader.u_ViewMatrix.value(this._modelMatrix._elements);
        _gl3.drawElements(_gl3.TRIANGLES, this._pointNum, _gl3.UNSIGNED_BYTE, 0);
      }

      let 片元漫反射平面shader = null;
      let 片元漫反射平面shader_init = function () {
        let face_shader = shader
          .shaderV()
          //顶点坐标 顶点颜色 法向量
          .attribute().vec4(["a_Position", "a_Color", "a_Normal"])
          //观察矩阵  mat4 不能传递数组
          .uniform().mat4("u_MvpMatrix")
          //模型矩阵 
          .uniform().mat4("u_ViewMatrix")
          //varying
          .varying().vec4("v_Color")
          .varying().vec4("v_Normal")
          .void().funcStart("main")
          .$("gl_Position = u_MvpMatrix * u_ViewMatrix * a_Position")
          .$("v_Color = a_Color")
          .$("v_Normal = u_ViewMatrix * a_Normal")
          .funcEnd()
          .shaderF()
          .precompile("#ifdef GL_ES")
          .$("precision mediump float")
          .precompile("#endif")
          //光照颜色 归一化的世界坐标
          .uniform().vec3(["u_LightColor", "u_LightDirection"])
          //环境光颜色
          .uniform().vec3("u_huanjinguang")
          .varying().vec4("v_Color")
          .varying().vec4("v_Normal")
          .void().funcStart("main")
          //归一化
          .$("vec3 normal = normalize(v_Normal.xyz)")
          .$("float nDotL = max(dot(u_LightDirection, normal),0.0)")
          .$("vec3 diffuse = u_LightColor * v_Color.rgb * nDotL")
          .$("diffuse = diffuse + u_huanjinguang * v_Color.rgb")
          .$("gl_FragColor = vec4(diffuse,v_Color.a)")
          .funcEnd()
          .create();
        let renderCamera = render.getCamera();
        //统一设置观察矩阵
        renderCamera._shaderFuncArr.push(function (m) {
          let s = 片元漫反射平面shader;
          s.use();
          s.u_MvpMatrix.value(m);
        })
        片元漫反射平面shader = face_shader;
        //防止多次创建 
        片元漫反射平面shader_init = function (face_type) {
          return 片元漫反射平面shader;
        }
        return face_shader;

      }

      let 片元漫反射平面shader_load = function (data1, data2, data3, data4) {
        let _shader = this._shader;
        let a_Position_Buffer = _shader.buffer();
        let a_Color_Buffer = _shader.buffer();
        let a_Normal_Buffer = _shader.buffer();
        let elebuffer = _shader.buffer("element");

        a_Position_Buffer.load(data1);
        a_Color_Buffer.load(data2);
        a_Normal_Buffer.load(data3);
        elebuffer.load(data4);

        this.a_Position_Buffer = a_Position_Buffer;
        this.a_Color_Buffer = a_Color_Buffer;
        this.a_Normal_Buffer = a_Normal_Buffer;
        this.elebuffer = elebuffer;

        this._pointNum = data4.length;
      }
      let 片元漫反射平面shader_draw = function () {
        let _shader = this._shader;
        let _gl3 = _shader.gl3;
        let a_Position_Buffer = this.a_Position_Buffer;
        let a_Color_Buffer = this.a_Color_Buffer;
        let a_Normal_Buffer = this.a_Normal_Buffer;

        _shader.use();

        this.elebuffer.bindBuffer();

        a_Position_Buffer.bindBuffer();
        //单个使用 easyTo 而不是 arrEasyTo
        a_Position_Buffer.easyTo(
          {
            start: 1,
            end: 3,
            to: _shader.a_Position
          }
        );

        a_Color_Buffer.bindBuffer();
        a_Color_Buffer.easyTo(
          {
            start: 1,
            end: 3,
            to: _shader.a_Color
          }
        );

        a_Normal_Buffer.bindBuffer();
        a_Normal_Buffer.easyTo(
          {
            start: 1,
            end: 3,
            to: _shader.a_Normal
          }
        );

        _shader.u_ViewMatrix.value(this._modelMatrix._elements);
        _gl3.drawElements(_gl3.TRIANGLES, this._pointNum, _gl3.UNSIGNED_BYTE, 0);
      }


      return {
        /**
         * 创建一个平面
         * @param {int} pointNum 
         */
        create_纯色平面: function () {
          let o = Object.create(null);
          o._shader = 纯色平面shader_init();
          o.__load = 纯色平面shader_load;
          o.__draw = 纯色平面shader_draw;
          return o;
        },
        create_漫反射平面: function () {
          let o = Object.create(null);
          o._shader = 漫反射平面shader_init();
          o.__load = 漫反射平面shader_load;
          o.__draw = 漫反射平面shader_draw;
          return o;
        },
        create_片元漫反射平面: function () {
          let o = Object.create(null);
          o._shader = 片元漫反射平面shader_init();
          o.__load = 片元漫反射平面shader_load;
          o.__draw = 片元漫反射平面shader_draw;
          return o;
        }

      }
    })();
    //坐标变换
    let xyz = (function () {
      /**
       * 初始化 传入一个数组
       * @param {Array} 初始坐标数组 
       */
      function init (初始坐标数组, 初始化方向数组) {
        if (初始坐标数组) {
          this._wArr[0] = 初始坐标数组[0];
          this._wArr[1] = 初始坐标数组[1];
          this._wArr[2] = 初始坐标数组[2];
          this._wChangeFlg = true;
        }
        if (初始化方向数组) {
          this._rArr[0] = 初始化方向数组[0];
          this._rArr[1] = 初始化方向数组[1];
          this._rArr[2] = 初始化方向数组[2];
          this._rxChangeFlg = true;
          this._ryChangeFlg = true;
          this._rzChangeFlg = true;
        }
      }

      return {
        create: function () {
          let o = {
            //world X
            //内部arr
            _wChangeFlg: true,
            _wArr: new Float32Array([0, 0, 0]),
            set _wx (a) { this._wArr[0] = a; this._wChangeFlg = true; },
            get _wx () { return this._wArr[0] },
            set _wy (a) { this._wArr[1] = a; this._wChangeFlg = true; },
            get _wy () { return this._wArr[1] },
            set _wz (a) { this._wArr[2] = a; this._wChangeFlg = true; },
            get _wz () { return this._wArr[2] },
            //画面 Frame X
            set _fx (a) { },
            get _fx () { return this._wx - this._camera._wx },
            set _fy (a) { },
            get _fy () { return this._wy - this._camera._wy },
            set _fz (a) { },
            get _fz () { return this._wz - this._camera._wz },

            //方向
            _rxChangeFlg: true,
            _ryChangeFlg: true,
            _rzChangeFlg: true,
            _rArr: new Float32Array([0, 0, 0]),
            //x轴旋转角度
            set _rx (a) { this._rArr[0] = a; this._rxChangeFlg = true; },
            get _rx () { return this._rArr[0] },
            //x轴旋转角度
            set _ry (a) { this._rArr[1] = a; this._ryChangeFlg = true; },
            get _ry () { return this._rArr[1] },
            //y轴旋转角度
            set _rz (a) { this._rArr[2] = a; this._rzChangeFlg = true; },
            get _rz () { return this._rArr[2] },

            _camera: render.getCamera(),
            __init: init
          }

          return o;
        }
      }
    })();
    //方块
    let cube = (function () {
      baseCube = {};

      //清空对象
      function init () {
        baseCube = {};
      }

      //根据边长生成顶点数据生成
      function set (长, 宽, 高) {
        if (!长) util.error(msg.m7);
        //是立方体
        if (!宽 && !高) 宽 = 高 = 长;
        let x = 长 / 2;
        let y = 高 / 2;
        let z = 宽 / 2;
        let e = [
          x, y, z,
          x, y, -z,
          -x, y, -z,
          -x, y, z,
          x, -y, z,
          x, -y, -z,
          -x, -y, -z,
          -x, -y, z
        ];
        baseCube.体积 = 长 * 宽 * 高;
        baseCube.dingDian = new Float32Array(e);
        baseCube.v_index = new Uint8Array([
          0, 1, 2, 0, 2, 3,    // up
          0, 5, 2, 0, 5, 4,    // right
          4, 5, 6, 4, 6, 7,    // up
          7, 6, 3, 6, 3, 2,    // left
          0, 3, 7, 0, 7, 4,    // down
          1, 2, 6, 1, 6, 5     // back
        ]);
      }

      return {
        create: function (质量, 粒子数, 长, 宽, 高) {
          set(长, 宽, 高);
          let obj = Object.create(baseObj.create(质量, baseCube.体积, 粒子数));
          obj.dingdian = baseCube.dingDian;
          obj.v_index = baseCube.v_index;
          init();
          return obj;
        },
      }
    })();
    //地图
    let map = (function () {








      return {
        //创建地图
        create: function () {

        },
        //绑定环境
        bind: function () {

        },
        //加载地图
        load: function () {

        }
      };
    })();
    //环境
    let environment = (function () {

      let baseEnvironment = {
        //天气
        weater: {},
        //地图地形
        map: {},
        //环境光照
        light: {},
      }





      return {
        init: function () {

        },
        create: function () {

        }
      };
    })();
    //控制
    let control = (function () {
      let _keyCode = {
        A: 65,
        B: 66,
        C: 67,
        D: 68,
        E: 69,
        F: 70,
        G: 71,
        H: 72,
        I: 73,
        J: 74,
        K: 75,
        L: 76,
        M: 77,
        N: 78,
        O: 79,
        P: 80,
        Q: 81,
        R: 82,
        S: 83,
        T: 84,
        U: 85,
        V: 86,
        W: 87,
        X: 88,
        Y: 89,
        Z: 90,
        0: 48,
        1: 49,
        2: 50,
        3: 51,
        4: 52,
        5: 53,
        6: 54,
        7: 55,
        8: 56,
        9: 57,
        0: 96,
        //小键盘
        s1: 97,
        s2: 98,
        s3: 99,
        s4: 100,
        s5: 101,
        s6: 102,
        s7: 103,
        s8: 104,
        s9: 105,
        "*": 106,
        "+": 107,
        sEnter: 108,
        "-": 109,
        ".": 110,
        "/": 111,
        F1: 112,
        F2: 113,
        F3: 114,
        F4: 115,
        F5: 116,
        F6: 117,
        F7: 118,
        F8: 119,
        F9: 120,
        F10: 121,
        F11: 122,
        F12: 123,
        //功能键
        BackSpace: 8,
        Tab: 9,
        Clear: 12,
        Enter: 13,
        Shift: 16,
        Control: 17,
        Alt: 18,
        "Cape Lock": 19,
        Esc: 27,
        Spacebar: 32,
        "Page Up": 33,
        "Page Down": 34,
        End: 35,
        Home: 36,
        "Left Arrow": 37,
        "Up Arrow": 38,
        "Right Arrow": 39,
        "Down Arrow": 40,
        Insert: 45,
        Delete: 46,
        "Num Lock": 144,
        ";:": 186,
        "=+": 187,
        "-_": 189,
        ".>": 190,
        "/?": 191,
        "`~": 192,
        "[{": 219,
        "/|": 220,
        "]}": 221
      }
      return {
        /**
         * 按键映射建立
         * 返回映射建立代码发布前建议移除
         * keyArray:需要监听的按键    nameArray:按键对应名
         */
        __keyboard: function (keyArray, nameArray) {
          let keyCode = _keyCode;

          let codeStr = "let dbcControl = dbc.control();\n";
          //变量声明
          for (let i = 0, len = keyArray.length; i < len; i++) {
            codeStr += "  dbcControl." + nameArray[i] + "_down = 0;\n";
            codeStr += "  dbcControl." + nameArray[i] + "_up = 0;\n";
          }
          codeStr += "\n";
          codeStr += "document.onkeydown = function(e){\n";
          codeStr += "    let code = e.keyCode;\n";
          codeStr += "    let dbcControl = dbc.control();\n";
          codeStr += "    switch(code){\n";
          let funcKeyUpStr = "document.onkeyup = function(e){\n";
          funcKeyUpStr += "    let code = e.keyCode;\n";
          funcKeyUpStr += "    let dbcControl = dbc.control();\n";
          funcKeyUpStr += "    switch(code){\n";
          for (let i = 0, len = keyArray.length; i < len; i++) {
            codeStr += "      case " + keyCode[keyArray[i]] + ":\n";
            codeStr += "        dbcControl." + nameArray[i] + "_down = 1;\n";
            codeStr += "        dbcControl." + nameArray[i] + "_up = 0;\n";
            //return false 阻止冒泡 阻止默认事件
            codeStr += "        " + "return false;\n";

            funcKeyUpStr += "      case " + keyCode[keyArray[i]] + ":\n";
            funcKeyUpStr += "        dbcControl." + nameArray[i] + "_down = 0;\n";
            funcKeyUpStr += "        dbcControl." + nameArray[i] + "_up = 1;\n";
            funcKeyUpStr += "        " + "return false;\n";
          }

          codeStr += "    }\n}";
          funcKeyUpStr += "    }\n}";
          codeStr += "\n\n" + funcKeyUpStr;

          eval(codeStr);
          //console.log(codeStr);
        },
        /**
         * 鼠标事件
         */
        __mouse: function () {
          document.onmousedown = function (e) {
            let dbcControl = dbc.control();
            dbcControl.mousedown = true;
            dbcControl.mouseup = 0;
            dbcControl.mousedownX = e.clientX;
            dbcControl.mousedownY = e.clientY;
          }
          document.onmouseup = function (e) {
            let dbcControl = dbc.control();
            dbcControl.mousedown = false;
            dbcControl.mouseup = 1;
            dbcControl.mousedupX = e.clientX;
            dbcControl.mousedupY = e.clientY;
          }
          document.onmousemove = function (e) {
            let dbcControl = dbc.control();
            dbcControl.moveX = e.clientX;
            dbcControl.moveY = e.clientY;
          }
          window.addWheelListener(document, function (e) {
            e.preventDefault();
            let dbcControl = dbc.control();
            dbcControl.WheelMove = true;
            dbcControl.wheelY = e.deltaY;
            dbcControl.wheelZ = e.deltaZ;
            dbcControl.wheelX = e.deltaX;
            dbcControl.deltaMode = e.deltaMode;
            // console.log("mouse deltaMode:" + dbcControl.deltaMode);
            // console.log("mouse wheelY:" + dbcControl.wheelY);
            // console.log("mouse wheelZ:" + dbcControl.wheelZ);
            // console.log("mouse wheelX:" + dbcControl.wheelX);
          }, { passive: false });

        },
        /**
         * 捕获关闭 
         */
        __cancel: function () {
          document.onkeydown = null;
          document.onkeyup = null;
        },
      };
    })();
    //工具
    let tool = (function () {
      let mapMaker = {

      };



      return {
        //地图编辑
        mapMaker: mapMaker,






      }
    })();

    return {
      // const
      dbc_type_point: 1,
      dbc_type_face: 2,
      //中间连接件
      dbc_type_middle: 3,
      //基本件
      dbc_type_baseObj: 4,
      //组合体
      dbc_type_combinant: 5,
      //纯色平面
      dbc_faceType_纯色平面: 6,
      /**
       * 初始化
       */
      init: function () {
        shader.init();
        render.init();
      },
      /**
       * 设置canvas
       */
      set_canvas: function (cid3d, cid2d) {
        config.set_canvas(cid3d, cid2d);
        this.init();
      },
      set_canvas2: function (cid2d) {
        config.set_canvas(cid2d);
      },
      set_canvas3: function (cid3d) {
        config.set_canvas(cid3d)
        this.init();
      },
      /**
      * 获取上下文
      */
      get_gl3: () => config.get_gl3(),
      get_gl2: () => config.get_gl2(),
      get_aspectRatio: () => config.get_aspectRatio(),
      /**
       * 获取shader模块
       */
      shader: () => shader,
      /**
       * 获取render模块  
       */
      render: () => render,
      /**
       * 获取face模块  
       */
      face: () => face,
      /**
       * 获取控制模块
       */
      control: () => control,
      /**
       * 摄像机
       */
      camera: () => camera,
      /**
       * 创建一个dbc baseObj对象
       */
      create: (type) => baseObj.create(type),
      /**
       * 设置摄影机
       */
      setCamera: function (o) {
        render.setCamera(o);
      },

      //运行 b 
      run: function (game) {



      },
      test: function () {


      },
      //创建一个自定义模块
      moduleCreate: function () {
        return Object.create(baseObj, create(0));
      },

    }
  } catch (e) {
    console.log("Error:" + (e.msg || e.message));
    throw e;
  }
})();