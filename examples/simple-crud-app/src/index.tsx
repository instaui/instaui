import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Create a root element to render the app
const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);

// Render the App component
root.render(
	<React.StrictMode>
		<App/>
	</React.StrictMode>
);