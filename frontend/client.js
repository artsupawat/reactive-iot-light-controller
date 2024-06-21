const { fromEvent } = rxjs;
const axios = window.axios;
const io = window.io;

const toggleBtn = document.getElementById('toggleBtn');
const statusList = document.getElementById('statusList');

/**
 * isLightOn state to keep track of the light status
 * it will be set to true when client receives CommandSuccess status
 *
 * @type {boolean}
 */
let isLightOn = false;

// Create observable of toggle button click event
const toggleButtonClick$ = fromEvent(toggleBtn, 'click');

toggleButtonClick$.subscribe(() => {
  console.log('ToggleButtonClicked');
  const newCommand = isLightOn ? 'off' : 'on';
  console.log('CommandCreated');

  // Clear status list
  statusList.innerHTML = '';

  // Add CommandCreated status to the status list
  const li = document.createElement('li');
  li.textContent = 'CommandCreated';

  axios
    .post('http://localhost:3000/v1/light/command', { command: newCommand })
    .then((response) => {
      if (response.status === 200) {
        console.log('CommandSent');

        // Create a new WebSocket connection
        const socket = io('localhost:3000');

        // Create observable of socket connection
        const commandStatus$ = new rxjs.Observable((observer) => {
          socket.on('commandStatus', (status) => {
            observer.next(status);
          });
        });

        commandStatus$.subscribe((status) => {
          // log the status to the console
          console.log(status);

          const li = document.createElement('li');
          li.textContent = status;
          statusList.appendChild(li);

          // Update the light status when the command status is CommandSuccess
          if (status === 'CommandSuccess') {
            isLightOn = !isLightOn;
            updateToggleButtonState();
          } else if (status === 'CommandFailed') {
            alert('Failed to control the light, please try again')
          }

          // Disconnect the socket when the command status is CommandFailed or CommandSuccess
          if (status === 'CommandFailed' || status === 'CommandSuccess') {
            socket.disconnect();
          }
        });
      } else {
        console.log('CommandSentFailed');
        console.error('Error:', response);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});

function updateToggleButtonState() {
  if (isLightOn) {
      toggleBtn.textContent = 'Turn Off';
      toggleBtn.classList.add('off')
  } else {
      toggleBtn.textContent = 'Turn On';
      toggleBtn.classList.remove('off')
  }
}