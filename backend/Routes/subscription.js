const express = require('express');
const router = express.Router();
const Docker = require('dockerode');

// Initialize Docker client
// By default, dockerode will look for the Unix socket at /var/run/docker.sock
// or use environment variables on Windows/macOS Docker Desktop
const docker = new Docker();

router.post('/subscribe', async (req, res) => {
  try {
    // In a real app: you'd identify the user from req.body or req.user
    // and store the container info in a DB, so you can track who owns which container.

    // 1. Decide on a host port for this user’s container. 
    //    You can pick a random free port, or store a globally unique port per user in your DB.
    //    For demonstration, let's pick a random ephemeral port in [49152..65535]
    const userPort = Math.floor(Math.random() * (65535 - 49152)) + 49152; 

    // 2. Create and start a container from your pre-built "my-task-app" image.
    //    We’ll map container port 5000 -> userPort on the host.
    const container = await docker.createContainer({
      Image: 'my-task-app',
      // Give each container a unique name, e.g. "task-app-USER_<userid>"
      // name: `task-app-user-${someUserId}`,
      ExposedPorts: {
        '5000/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '5000/tcp': [
            {
              HostPort: userPort.toString()
            }
          ]
        },
        // Optional: Always restart if Docker or the container stops
        RestartPolicy: {
          Name: 'always'
        }
      }
    });

    // 3. Actually start the container
    await container.start();

    // 4. Return the container's address so the user (or your frontend) can access it
    //    For dev, Docker is typically on localhost. 
    //    In production, you might have to map the container host (server IP or domain).
    const containerUrl = `http://localhost:${userPort}`;

    // You could store container details in DB here:
    //   await db.save({
    //     userId: someUserId,
    //     containerId: container.id,
    //     port: userPort,
    //     createdAt: new Date()
    //   });

    return res.json({ 
      message: 'Subscription successful. New container started.', 
      containerUrl 
    });
    
  } catch (error) {
    console.error('Error creating container:', error);
    return res.status(500).json({ error: 'Container creation failed.' });
  }
});

module.exports = router;
