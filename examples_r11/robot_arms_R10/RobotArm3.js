/*
 * Renderer 9. The MIT License.
 * Copyright (c) 2022 rlkraft@pnw.edu
 * See LICENSE for details.
*/

import {Scene, Model, Position, Matrix, Vertex, LineSegment} from "../../renderer/scene/SceneExport.js";
import {rastDebug, render1 as render, renderFB1 as renderFB, setClipDebug, setRastDebug} from "../../renderer/pipeline/PipelineExport.js";
import * as ModelShading from "../../renderer/scene/util/UtilExport.js";
import {FrameBuffer, Color} from "../../renderer/framebuffer/FramebufferExport.js";
import { format } from "../../renderer/scene/util/UtilExport.js";

/**
   Draw an interactive robot arm with shoulder, elbow, wrist, and finger joints.
   Make each part of the robot arm extendable.
<p>
   The tree for this scene is shown below.
<p>
   Remember that every position node in the tree contains a matrix,
   a model and a list of nested positions. The model may be empty,
   and the list of nested positions may also be empty, but the matrix
   cannot be "empty" (if you don't give it a value, then it is the
   identity matrix, I).
<p>
<pre>{@code
          Scene
         /     \
        /       \
  Camera   List<Position>
               |
               |
            Position
            /  |    \
           /   |     \
     Matrix    |     List<Position>
       RS      |           |
               |           |
              /        Position
             /         /   |   \
            /         /    |    \
           /     Matrix   /      List<Position>
          |       TRS    /             |
          |             /              |
          |            /            Position
          |           /             /  |   \
          |          /             /   |    \
          |         /        Matrix    |     List<Position>
          |        /          TRS      |           |
          |       /                   /            |
           \     /                   /          Position
            Model ------------------/           /  |   \
          armSegment                           /   |    \
                    \                    Matrix    |     List<Position>
                     \                    TRS     /             |
                      \                          /            empty
                       \------------------------/

</pre>
*/

let shoulderRotation = 0.0;
let    elbowRotation = 0.0;
let    wristRotation = 0.0;
let   fingerRotation = 0.0;

let shoulderLength = 0.4;
let    elbowLength = 0.3;
let    wristLength = 0.2;
let   fingerLength = 0.1;

// Create one Model that can be used
// for each sement of the robot arm.
const v0 = new Vertex(0, 0, 0);
const v1 = new Vertex(1, 0, 0);

const armSegment = Model.buildName("arm_segment");
armSegment.addVertex(v0, v1);
armSegment.addPrimitive(LineSegment.buildVertex(0, 1));
ModelShading.setColor(armSegment, Color.blue);

/*
   Create the scene graph.
*/
const scene = Scene.buildFromName("Robot Arm 3");

// Create a Position object that will hold the robot arm.
const shoulder_p = Position.buildFromName("shoulder");

// Add the Position object to the scene.
scene.addPosition(shoulder_p);

// Push the position away from where the camera is.
shoulder_p.setMatrix(Matrix.translate(0, 0, -1));

// Add the armSegment Model to the Scene's Position.
shoulder_p.setModel(armSegment);

const elbow_p = Position.buildFromModelName(armSegment, "elbow");
shoulder_p.addNestedPosition(elbow_p);

const wrist_p = Position.buildFromModelName(armSegment, "wrist");
elbow_p.addNestedPosition(wrist_p);

const finger_p = Position.buildFromModelName(armSegment, "finger");
wrist_p.addNestedPosition(finger_p);

setTransformations();

let fb = new FrameBuffer(1024, 1024);

runOnline();
setUpViewing();

function runOnline()
{
   document.addEventListener("keypress", keyPressed);
   document.addEventListener("keydown", overrideDefault);
   const resizer = new ResizeObserver(windowResized);
   resizer.observe(document.getElementById("resizer"));
   setUpViewing();
}

function keyPressed(e)
{
   const c = e.key;

   if ('h' == c)
   {
      printHelpMessage();
      return;
   }
   else if ('d' == c && e.altKey)
   {
      console.log();
      console.log(scene.toString());
   }
   else if ('d' == c)
   {
      scene.debug = ! scene.debug;
      setClipDebug(scene.debug);
   }
   else if ('D' == c)
   {
      setRastDebug(!rastDebug);
   }
   else if ('c' == c)
   {
      // Change the solid random color of the robot arm.
      const color = ModelShading.randomColor();

      ModelShading.setColor(shoulder_p.getModel(), color);
      ModelShading.setColor(elbow_p.getModel(), color);
      ModelShading.setColor(wrist_p.getModel(), color);
      ModelShading.setColor(finger_p.getModel(), color);
   }
   else if ('C' == c)
   {
      // Change the solid random color of each segment of the robot arm.
      ModelShading.setRandomColor(shoulder_p.getModel());
      ModelShading.setRandomColor(elbow_p.getModel());
      ModelShading.setRandomColor(wrist_p.getModel());
      ModelShading.setRandomColor(finger_p.getModel());
   }
   else if ('r' == c)
   {
      // Change the random color at each end of each segment of the robot arm.
      ModelShading.setRainbowPrimitiveColors(shoulder_p.getModel());
      ModelShading.setRainbowPrimitiveColors(elbow_p.getModel());
      ModelShading.setRainbowPrimitiveColors(wrist_p.getModel());
      ModelShading.setRainbowPrimitiveColors(finger_p.getModel());
   }
   else if ('R' == c)
   {
      // Change the random color at each vertex of the robot arm.
      const c1 = ModelShading.randomColor();
      const c2 = ModelShading.randomColor();
      const c3 = ModelShading.randomColor();
      const c4 = ModelShading.randomColor();
      const c5 = ModelShading.randomColor();

      shoulder_p.getModel().colorList.length = 0;
         elbow_p.getModel().colorList.length = 0;
         wrist_p.getModel().colorList.length = 0;
        finger_p.getModel().colorList.length = 0;

      shoulder_p.getModel().addColor(c1, c2);
         elbow_p.getModel().addColor(c2, c3);
         wrist_p.getModel().addColor(c3, c4);
        finger_p.getModel().addColor(c4, c5);

      shoulder_p.getModel().getPrimitive(0).setColorIndices(0, 1);
         elbow_p.getModel().getPrimitive(0).setColorIndices(0, 1);
         wrist_p.getModel().getPrimitive(0).setColorIndices(0, 1);
        finger_p.getModel().getPrimitive(0).setColorIndices(0, 1);
   }
   else if ('=' == c)
   {
      shoulderRotation = 0.0;
         elbowRotation = 0.0;
         wristRotation = 0.0;
        fingerRotation = 0.0;
   }
   else if ('s' == c)
   {
      shoulderRotation += 2.0;
   }
   else if ('S' == c)
   {
      shoulderRotation -= 2.0;
   }
   else if ('e' == c)
   {
      elbowRotation += 2.0;
   }
   else if ('E' == c)
   {
      elbowRotation -= 2.0;
   }
   else if ('w' == c)
   {
      wristRotation += 2.0;
   }
   else if ('W' == c)
   {
      wristRotation -= 2.0;
   }
   else if ('f' == c)
   {
      fingerRotation += 2.0;
   }
   else if ('F' == c)
   {
      fingerRotation -= 2.0;
   }
   else if ('s' == c && e.ctrlKey)
   {
      shoulderLength += .1;
   }
   else if ('S' == c && e.ctrlKey)
   {
      shoulderLength -= .1;
   }
   else if ('e' == c && e.ctrlKey)
   {
      elbowLength += .1;
   }
   else if ('E' == c && e.ctrlKey)
   {
      elbowLength -= .1;
   }
   else if ('w' == c && e.ctrlKey)
   {
      wristLength += .1;
   }
   else if ('W' == c && e.ctrlKey)
   {
      wristLength -= .1;
   }
   else if ('f' == c && e.ctrlKey)
   {
      fingerLength += .1;
   }
   else if ('F' == c && e.ctrlKey)
   {
      fingerLength -= .1;
   }

   setTransformations();
   setUpViewing();
}

function overrideDefault(e)
{
   const c = e.key;

   if ('s' == c && e.ctrlKey)
   {
      e.preventDefault();
      shoulderLength += .1;
   }
   else if ('S' == c && e.ctrlKey)
   {
      e.preventDefault();
      shoulderLength -= .1;
   }
   else if ('e' == c && e.ctrlKey)
   {
      e.preventDefault();
      elbowLength += .1;
   }
   else if ('E' == c && e.ctrlKey)
   {
      e.preventDefault();
      elbowLength -= .1;
   }
   else if ('w' == c && e.ctrlKey)
   {
      e.preventDefault();
      wristLength += .1;
   }
   else if ('W' == c && e.ctrlKey)
   {
      e.preventDefault();
      wristLength -= .1;
   }
   else if ('f' == c && e.ctrlKey)
   {
      e.preventDefault();
      fingerLength += .1;
   }
   else if ('F' == c && e.ctrlKey)
   {
      e.preventDefault();
      fingerLength -= .1;
   }
   else if('d' == c && e.altKey)
   {
      e.preventDefault();
      console.log(scene.toString());
   }

   setTransformations();
   setUpViewing();
}

function windowResized()
{
   // Get the new size of the canvas
   const resizer = document.getElementById("resizer");
   const w = resizer?.offsetWidth;
   const h = resizer?.offsetHeight;

   // Create a new FrameBuffer that fits the canvas    
   const bg1 = fb.getBackgroundColorFB();
   const bg2 = fb.getViewport().getBackgroundColorVP();

   //@ts-ignore
   fb = new FrameBuffer(w, h, bg1);
   fb.vp.setBackgroundColorVP(bg2);

   setUpViewing();
}

function setUpViewing()
{
   // get the size of the resizer so we know what size to make the fb
   const resizer = document.getElementById("resizer");
   const w = resizer?.offsetWidth;
   const h = resizer?.offsetHeight;

   //@ts-ignore
   fb = new FrameBuffer(w, h, fb.bgColorFB);
   render(scene, fb.vp);

   // @ts-ignore
   const ctx = document.getElementById("pixels").getContext("2d");
   ctx.canvas.width = w;
   ctx.canvas.height = h;
   
   ctx.putImageData(new ImageData(fb.pixelBuffer, fb.width, fb.height), fb.vp.vp_ul_x, fb.vp.vp_ul_y);
}

function setTransformations()
{
   // Initialize the nested matrices for the sub models.
   shoulder_p.matrix2Identity()
                .mult(Matrix.translate(0, 0, -1))
                .mult(Matrix.rotateZ(shoulderRotation))
                .mult(Matrix.scaleXYZ(shoulderLength,
                                   shoulderLength,
                                   1));

      elbow_p.matrix2Identity()
             .mult(Matrix.translate(1, 0, 0))
             .mult(Matrix.rotateZ(elbowRotation))
             .mult(Matrix.scaleXYZ(elbowLength/shoulderLength,
                                elbowLength/shoulderLength,
                                1));

      wrist_p.matrix2Identity()
             .mult(Matrix.translate(1, 0, 0))
             .mult(Matrix.rotateZ(wristRotation))
             .mult(Matrix.scaleXYZ(wristLength/elbowLength,
                                wristLength/elbowLength,
                                1));

      finger_p.matrix2Identity()
              .mult(Matrix.translate(1, 0, 0))
              .mult(Matrix.rotateZ(fingerRotation))
              .mult(Matrix.scaleXYZ(fingerLength/wristLength,
                                 fingerLength/wristLength,
                                 1));
}

function printHelpMessage()
{
   console.log("Use the 'd' key to toggle debugging information on and off.");
   console.log("Use the 'Alt-d' key combination to print the Scene data structure.");
   console.log("Use the 'c' key to change the random solid arm color.");
   console.log("Use the 'C' key to randomly change arm segment colors.");
   console.log("Use the 'r' key to randomly change arm segment end colors.");
   console.log("Use the 'R' key to randomly change arm hinge colors.");
   console.log("Use the s/S keys to rotate the arm at the shoulder.");
   console.log("Use the e/E keys to rotate the arm at the elbow.");
   console.log("Use the w/W keys to rotate the arm at the wrist.");
   console.log("Use the f/F keys to rotate the arm at the finger.");
   console.log("Use the ctrl s/S keys to extend the arm at the shoulder.");
   console.log("Use the ctrl e/E keys to extend the arm at the elbow.");
   console.log("Use the ctrl w/W keys to extend the arm at the wrist.");
   console.log("Use the ctrl f/F keys to extend the arm at the finger.");
   console.log("Use the '=' key to reset the robot arm.");
   console.log("Use the 'h' key to redisplay this help message.");
}