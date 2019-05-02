(function () {
  'use strict';

  const render = function (messages) {
    const html = messages.map(message =>
      `<li class="message">
        <div class="label">${message.text}</div>
        <div class="likes" data-message-id="${message.id}">
          <span class="button">👍</span>
          <span class="count">${message.likes || 0}</span>
        </div>
      </li>`
    ).join('');

    document.querySelector('.messages').innerHTML = html;
  };

  window.render = render;
})();
