// Copyright (c) 2014 Turbulenz Limited
/* global Protolib: false*/
/* global Config: false*/
/* global Physics2DDevice: false*/
/* global Physics2DDebugDraw: false*/

function Application() {}
Application.prototype =
{
    // Use the properties from Config by default, otherwise use these defaults
    protolibConfig: Protolib.extend(true, {
        fps: 60,
        useShadows: true
    },
    Config),

    init: function initFn()
    {
        // Locally referenced variables to use for this function
        var protolib = this.protolib;
        var mathDevice = protolib.getMathDevice();
        var graphicsDevice = protolib.getGraphicsDevice();
        var inputDevice = protolib.getInputDevice();
        var draw2D = protolib.globals.draw2D;

        // Set the background color to clear during protolib.beginFrame
        protolib.setClearColor(mathDevice.v3Build(0.3, 0.3, 0.3));

        // Initialization code goes here

        var viewWidth = this.viewWidth = 20;
        var viewHeight = this.viewHeight = 10;
        var viewportRectangle = [0, 0, viewWidth, viewHeight];

        var phys2D = this.phys2D = Physics2DDevice.create();
        var phys2DDebug = this.phys2DDebug = Physics2DDebugDraw.create({
            graphicsDevice: graphicsDevice
        });

        phys2DDebug.setPhysics2DViewport(viewportRectangle);
        draw2D.configure({
            viewportRectangle: viewportRectangle,
            scaleMode: 'scale'
        });

        var world = this.world = phys2D.createWorld({
            gravity: [-1, 0]
        });

        var box = this.box = {
            width: 1,
            height: 1,
            position: [viewWidth, viewHeight / 2 + 0.1]
        };
        box.shape = phys2D.createPolygonShape({
            vertices: phys2D.createBoxVertices(box.width, box.height)
        });
        box.rigidBody = phys2D.createRigidBody({
            type: 'dynamic',
            shapes: [
                box.shape
            ],
            position: box.position
        });
        world.addRigidBody(box.rigidBody);
        box.sprite = {
            texture: "textures/crate.jpg",
            position: [box.position[0] - box.width / 2, box.position[1] - box.height / 2],
            width: box.width,
            height: box.height,
            rotation: box.rigidBody.getRotation()
        };

        var ship = this.ship = {
            width: 3,
            height: 1.75,
            position: [ viewWidth / 2, viewHeight / 2]
        };
        ship.shape = phys2D.createPolygonShape({
            vertices: [ [ship.width / 2, 0],
                      [-ship.width / 2, ship.height / 2],
                      [-ship.width / 2, -ship.height / 2],
                      [ship.width / 2, 0] ]
        });
        ship.rigidBody = phys2D.createRigidBody({
            type: 'kinematic',
            shapes: [ship.shape],
            position: ship.position
        });
        world.addRigidBody(ship.rigidBody);

        ship.velocity = [0, 0];

        var that = this;
        this.touchPositionX = 0;
        this.touchPositionY = 0;
        that.touchID = null;
        that.touchCount = 0;

        this.touchPosition = [ship.position[0], ship.position[1]];
        inputDevice.addEventListener('touchstart', function (touchEvent)
        {
            var changedTouches = touchEvent.changedTouches;
            var touch;
            for (var i = 0; i < changedTouches.length; i += 1)
            {
                touch = changedTouches[i];
                if (that.touchID === null && touch.isGameTouch)
                {
                    that.touchID = touch.identifier;
                    draw2D.viewportMap(touch.positionX, touch.positionY, that.touchPosition);
                    that.touchCount += 1;
                }
            }
        });
        inputDevice.addEventListener('touchmove', function (touchEvent)
        {
            var changedTouches = touchEvent.changedTouches;
            var touch;
            for (var i = 0; i < changedTouches.length; i += 1)
            {
                touch = changedTouches[i];
                if (that.touchID === touch.identifier)
                {
                    draw2D.viewportMap(touch.positionX, touch.positionY, that.touchPosition);
                }
            }
        });

        function touchStop(touchEvent)
        {
            var changedTouches = touchEvent.changedTouches;
            var touch;
            for (var i = 0; i < changedTouches.length; i += 1)
            {
                touch = changedTouches[i];
                if (that.touchID === touch.identifier)
                {
                    that.touchID = null;
                    that.touchPosition[0] = that.ship.position[0];
                    that.touchPosition[1] = that.ship.position[1];
                }
            }
        }
        inputDevice.addEventListener('touchend', touchStop);
        inputDevice.addEventListener('touchleave', touchStop);

        ship.meshPosition = mathDevice.v3Build(0, 0, 0);
        ship.meshRotationMatrix = mathDevice.m43BuildIdentity();
        ship.mesh = protolib.loadMesh({
            mesh: "models/ship.dae",
            v3Position: ship.meshPosition,
            v3Size: mathDevice.v3Build(3, 3, 3)
        });

        var debug = this.debug = {
            meshRotateX: 0,
            meshRotateY: Math.PI * 3 / 2,
            meshRotateZ: 0
        };
        var pi2 = Math.PI * 2;
        protolib.addWatchVariable({
            title: "Mesh Rotate X",
            object: debug,
            property: "meshRotateX",
            group: "Debug",
            type: protolib.watchTypes.SLIDER,
            options: {
                min: 0,
                max: pi2,
                step: pi2 / 360
            }
        });
        this.xAxis = mathDevice.v3BuildXAxis();
        protolib.addWatchVariable({
            title: "Mesh Rotate Y",
            object: debug,
            property: "meshRotateY",
            group: "Debug",
            type: protolib.watchTypes.SLIDER,
            options: {
                min: 0,
                max: pi2,
                step: pi2 / 360
            }
        });
        this.yAxis = mathDevice.v3BuildYAxis();
        protolib.addWatchVariable({
            title: "Mesh Rotate Z",
            object: debug,
            property: "meshRotateZ",
            group: "Debug",
            type: protolib.watchTypes.SLIDER,
            options: {
                min: 0,
                max: pi2,
                step: pi2 / 360
            }
        });
        this.zAxis = mathDevice.v3BuildZAxis();

        protolib.setNearFarPlanes(0.1, 1000);
        protolib.setCameraPosition(mathDevice.v3Build(0, 0, -1));
        protolib.setCameraDirection(mathDevice.v3Build(0, 0, 1));
        protolib.setAmbientLightColor(mathDevice.v3Build(1, 1, 1));

        var viewport = this.viewport = {
            top: 0,
            bottom: protolib.height,
            left: 0,
            right: protolib.width,
            width: protolib.width,
            height: protolib.height
        };
        protolib.setPreDraw(function preDrawFn() {
            var x = draw2D.scissorX;
            var y = draw2D.scissorY;
            var width = draw2D.scissorWidth;
            var height = draw2D.scissorHeight;
            graphicsDevice.setViewport(x, y, width, height);
            graphicsDevice.setScissor(x, y, width, height);
            viewport.top = y;
            viewport.bottom = y + height;
            viewport.left = x;
            viewport.right = x + width;
            viewport.width = width;
            viewport.height = height;
        });

        protolib.setPostRendererDraw(function postRendererDrawFn() {
            graphicsDevice.setViewport(0, 0, protolib.width, protolib.height);
            graphicsDevice.setScissor(0, 0, protolib.width, protolib.height);
        });

        protolib.setPostDraw(function postDrawFn() {
            phys2DDebug.setScreenViewport(draw2D.getScreenSpaceViewport());
            if (protolib.globals.config.enablePhysicsDebug)
            {
                phys2DDebug.begin();
                phys2DDebug.drawWorld(world);
                phys2DDebug.end();
            }
        });

        this.realTime = 0;
    },

    update: function updateFn()
    {
        var protolib = this.protolib;
        var mathDevice = protolib.getMathDevice();
        var delta = protolib.time.app.delta;
        var world = this.world;

        if (protolib.beginFrame())
        {
            // Update code goes here
            this.realTime += delta;

            var keySpeedX = 6;
            var keySpeedY = 3;
            var keyDown = false;

            var shipPosition = this.ship.position;
            var shipRigidBody = this.ship.rigidBody;
            var shipVelocity = this.ship.velocity;
            if (protolib.isKeyDown(protolib.keyCodes.UP))
            {
                shipVelocity[1] = -keySpeedY;
                keyDown = true;
            }
            if (protolib.isKeyDown(protolib.keyCodes.DOWN))
            {
                shipVelocity[1] = keySpeedY;
                keyDown = true;
            }
            if (protolib.isKeyDown(protolib.keyCodes.LEFT))
            {
                shipVelocity[0] = -keySpeedX;
                keyDown = true;
            }
            if (protolib.isKeyDown(protolib.keyCodes.RIGHT))
            {
                shipVelocity[0] = keySpeedX;
                keyDown = true;
            }

            var touchPosition = this.touchPosition;
            if (!keyDown)
            {
                shipVelocity[0] = touchPosition[0] - shipPosition[0];
                shipVelocity[1] = touchPosition[1] - shipPosition[1];
            }
            shipRigidBody.setVelocity(shipVelocity);
            this.lastTouchCount = this.touchCount;

            while (world.simulatedTime < this.realTime)
            {
                world.step(1 / 60);
            }

            shipRigidBody.getPosition(shipPosition);
            shipPosition[0] = protolib.utils.clamp(shipPosition[0], 1, this.viewWidth - 1);
            shipPosition[1] = protolib.utils.clamp(shipPosition[1], 1, this.viewHeight - 1);
            shipRigidBody.setPosition(shipPosition);
            if (keyDown)
            {
                touchPosition[0] = shipPosition[0];
                touchPosition[1] = shipPosition[1];
            }

            var meshPosition = this.ship.meshPosition;
            meshPosition[0] = (-shipPosition[0] * 0.1) + 1;
            meshPosition[1] = (-shipPosition[1] * 0.15) + 0.8;
            this.ship.mesh.setPosition(meshPosition);

            var meshRotationMatrix = this.ship.meshRotationMatrix;
            var debug = this.debug;
            var meshRotateX = debug.meshRotateX;
            var meshRotateY = debug.meshRotateY;
            var meshRotateZ = debug.meshRotateZ;

            var tempRotationMatrix = this.tempRotationMatrix = mathDevice.m43BuildIdentity(this.tempRotationMatrix);
            mathDevice.m43BuildIdentity(meshRotationMatrix);

            mathDevice.m43SetAxisRotation(tempRotationMatrix, this.yAxis, meshRotateY);
            mathDevice.m43Mul(meshRotationMatrix, tempRotationMatrix, meshRotationMatrix);

            mathDevice.m43SetAxisRotation(tempRotationMatrix, this.zAxis, meshRotateZ);
            mathDevice.m43Mul(meshRotationMatrix, tempRotationMatrix, meshRotationMatrix);

            mathDevice.m43SetAxisRotation(tempRotationMatrix, this.xAxis, meshRotateX);
            mathDevice.m43Mul(meshRotationMatrix, tempRotationMatrix, meshRotationMatrix);

            this.ship.mesh.setRotationMatrix(meshRotationMatrix);

            // Render code goes here
            var box = this.box;
            var sprite = box.sprite;
            var boxRigidBody = box.rigidBody;
            if (boxRigidBody)
            {
                boxRigidBody.getPosition(box.position);
                sprite.position[0] = box.position[0] - box.width / 2;
                sprite.position[1] = box.position[1] - box.height / 2;
                sprite.rotation = boxRigidBody.getRotation();

                protolib.draw2DSprite(sprite);
            }
            protolib.endFrame();
        }
    },

    destroy: function destroyFn()
    {
        var protolib = this.protolib;
        if (protolib)
        {
            // Destruction code goes here
            protolib.destroy();
            this.protolib = null;
        }
    }
};

// Application constructor function
Application.create = function applicationCreateFn(params)
{
    var app = new Application();
    app.protolib = params.protolib;
    if (!app.protolib)
    {
        var console = window.console;
        if (console)
        {
            console.error("Protolib could not be found");
        }
        return null;
    }
    app.init();
    return app;
};
