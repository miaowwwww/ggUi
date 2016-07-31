var ggapp = angular.module('ggUi', [])
ggapp.factory('ggPopup', ['$q', '$timeout','$rootScope','$compile', function($q, $timeout,$rootScope,$compile) {
  return {
    toast: _toast,
    confirm: _confirm,
    prompt: _prompt
  };

  /*
  *   ggUi.toast({text:String,time:2000}).then(function(){.......})
  *   连点的时候只会返回最后的一个promise
  *
  */
  var timer_toast = null;
  function _toast(options) {
    var $ = angular.element;
    var oToast = $(document.getElementById('ggToast'));
    if(oToast){
      $timeout.cancel(timer_toast);
      oToast.remove();
      // defer.resolve(); //不可尝试触发的是本次点击的promise
    }
    
    var _time = options.time || 1000;
    var _body = $(document.querySelector('body'));
    var defer = $q.defer();
    var promise = defer.promise;
    // 创建内容div
    var _wrapDiv = $("<div id='ggToast'>");

    // //内联css
    // _wrapDiv.css({
    //   //div的样式
    //   'display': 'block',
    //   'position': 'fixed',
    //   'min-width': '100px',
    //   'min-height': '35px',
    //   'max-width': '160px',
    //   'background': 'rgba(0, 0 , 0, 0.6)',
    //   'z-index': '1000',
    //   'border-radius': '6px',
    //   'top': '50%',
    //   'left': '50%',
    //   'transform': 'translate3d(-50%, -50%, 0)',
    //   '-webkit-transform': 'translate3d(-50%, -50%, 0)',
    //   'box-shadow': '0 0 2px 3px rgba(0, 0 , 0, 0.3)',
    //   // text的样式
    //   'opacity': '0.9',
    //   'filter': 'alpha(opacity=90)',
    //   'text-align': 'center',
    //   'color': '#000',
    //   'font-size': '14px',
    //   'padding': '10px',
    //   'white-space': 'normal'
    // });

    // 使用class代替css内联 或 id
    // _wrapDiv.addClass('ggToast');

    _wrapDiv.text(options.text);

    open();
    //进入body：open
    function open(){
        $(_body).append(_wrapDiv)
        close();
    }
    // 退出body：close------
    function close(){
        timer_toast = $timeout(function() {
          _wrapDiv.remove();
          defer.resolve();
        }, _time);
    }


    return promise;
  };

  /*
  *   ggUi.confirm('确定删除',{confirmBtn:'确定',cancelBtn:'再想想'},'删除后将无法恢复（可空）')
  *       .then(function(){...},function(){...},function(){...})
  *             confirm.bc      cancel.bc       (X and bg).bc
  *
  */
  function _confirm(title,config,describtion){
    describtion = describtion || "";
    var $ = angular.element;
    var defer = $q.defer();
    var _body = $(document.querySelector('body'));

    var html = [
          "<div id='gg_bg_black'>",
              "<div id='ggConfirm'>",
                // "<img class='bgImg' src='...'/>",
                "<div class='top'>",
                  "<h1 class='title'>" + title + "</h1>",
                  "<a></a>",  //关闭
                "</div>",
                "<div class='describtion'>" + describtion + "</div>",
                "<div class='btns'>",
                  "<a>"+ (config.cancelBtn || "取消") +"</a>",
                  "<a>" + (config.confirmBtn || "确定") + "</a>",
                "</div>",
              "</div>",
          "</div>"
        ].join('');

    var _html = $(html);

    // 点击背景
    _html.on('click',function(){
      _html.remove();
      defer.notify();
    })
    
    // 点击内容
    _html.children().on('click',function(event){
      event = event || window.event;
      event.preventDefault();
      event.stopPropagation();
    })

    // 按钮
    var aList = _html.find('a');
    aList.eq(0).on('click',function(){
      _html.remove();
      defer.notify();
    })
    aList.eq(1).on('click',function(){
      _html.remove();
      defer.reject();
    })
    aList.eq(2).on('click',function(){
      _html.remove();
      defer.resolve();
    })
    _body.append(_html);


    return defer.promise;
  }
  /*
  *    ggPopup.prompt('审判',
  *      {
  *        confirmBtn:'通过',
  *        cancelBtn:'不通过',
  *        isTextNeed:true,     //默认为false
  *        textRows:4           //默认为1
  *      },'请慎重决定')
  *      .then(
  *        function(data){console.log('confirm',data);},
  *        function(data){console.log('cancel',data);},
  *        function(data){console.log('notify',data)}
  *        )
  *
  */
  function _prompt(title,config,describtion){

    var $ = angular.element;
    var defer = $q.defer();
    var _body = $(document.querySelector('body'));

    var _html = $(html());
    // new scope
    var scope = $rootScope.$new(true);
    // 配置
    scope.describtion = describtion;
    scope.title = title;
    scope.config = config;
    // 定义方法
    scope.stopPropagation = function(event){
      event = event || window.event;
      event.stopPropagation();
    }
    scope.close = function(){
      _html.remove();
      defer.notify();
      scope.$destroy();
    }
    scope.cancel = function(){
      if(scope.config.isTextNeed && !scope.reason){
        defer.notify('不可为空');
      }else{
        _html.remove();
        scope.$destroy();
        defer.reject(scope.reason);
      }
    }
    scope.confirm = function(){
      if(scope.config.isTextNeed && !scope.reason){
        defer.notify('不可为空');
      }else{
        _html.remove();
        scope.$destroy();
        defer.resolve(scope.reason);
      }
    }
    // 生成html
    function html() {
        return [
            "<div id='gg_bg_black' ng-click='close()'>",
                "<div id='ggConfirm' ng-click='stopPropagation($event)'>",
                  // "<img class='bgImg' src='...'/>",
                  "<div class='top'>",
                    "<h1 class='title'>{{::title}}</h1>",
                    "<a ng-click='close()'></a>",  //关闭
                  "</div>",
                  "<div class='describtion' ng-if='describtion'>{{::describtion}}</div>",
                  "<textarea id='ggPromptText' rows='{{config.textRows || 1}}' ng-model='reason' ></textarea>",
                  "<div class='btns'>",
                    "<a ng-click='cancel()'>{{config.cancelBtn}}</a>",
                    "<a ng-click='confirm()'>{{config.confirmBtn}}</a>",
                  "</div>",
                "</div>",
            "</div>"
          ].join('');
    }
    // 绑定作用域
    $compile(_html)(scope)
    _body.append(_html);

    return defer.promise;
  }

}])
