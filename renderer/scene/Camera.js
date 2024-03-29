/*
 * Renderer 10. The MIT License.
 * Copyright (c) 2022 rlkraft@pnw.edu
 * See LICENSE for details.
*/

/**
   This {@code Camera} data structure represents a camera
   located at the origin, looking down the negative z-axis,
   with a near clipping plane.
<p>
   This {@code Camera} has a configurable "view volume" that
   determines what part of space the camera "sees" when we use
   the camera to take a picture (that is, when we render a
   {@link Scene}).
<p>
   This {@code Camera} can "take a picture" two ways, using
   a perspective projection or a parallel (orthographic)
   projection. Each way of taking a picture has a different
   shape for its view volume. The data in this data structure
   determines the shape of each of the two view volumes.
<p>
   For the perspective projection, the view volume (in view
   coordinates!) is an infinitely long pyramid that is formed
   by the pyramid with its apex at the origin and its base in
   the plane {@code z = -near} with edges {@code x = left},
   {@code x = right}, {@code y = top}, and {@code y = bottom}.
   The perspective view volume's shape is set by the
   {@link projPerspective} method.
<p>
   For the orthographic projection, the view volume (in view
   coordinates!) is an infinitely long rectangular cylinder
   parallel to the z-axis and with sides {@code x = left},
   {@code x = right}, {@code y = top}, and {@code y = bottom}
   (an infinite parallelepiped). The orthographic view volume's
   shape is set by the {@link projOrtho} method.
<p>
   When the graphics rendering {@link renderer.pipeline.Pipeline}
   uses this {@code Camera} to render a {@link Scene}, the renderer
   only "sees" the geometry from the scene that is contained in this
   camera's view volume. (Notice that this means the orthographic
   camera will see geometry that is behind the camera. In fact, the
   perspective camera also sees geometry that is behind the camera.)
   The renderer's {@link renderer.pipeline.NearClip} and
   {@link renderer.pipeline.Clip} pipeline stages are responsible
   for making sure that the scene's geometry that is outside of this
   camera's view volume is not visible.
<p>
   The plane {@code z = -near} (in view coordinates) is the camera's
   image plane. The rectangle in the image plane with corners
   {@code (left, bottom, -near)} and {@code (right, top, -near)} is
   the camera's view rectangle. The view rectangle is like the film
   in a real camera, it is where the camera's image appears when you
   take a picture. The contents of the camera's view rectangle (after
   it gets "normalized" to camera coordinates by the renderer's
   {@link renderer.pipeline.View2Camera} stage) is what gets rasterized,
   by the renderer's {@link renderer.pipeline.Rasterize}
   pipeline stage, into a {@link renderer.framebuffer.FrameBuffer}'s
   {@link renderer.framebuffer.FrameBuffer.Viewport}.
<p>
   For both the perspective and the parallel projections, the camera's
   near plane is there to prevent the camera from seeing what is "behind"
   the near plane. For the perspective projection, the near plane also
   prevents the renderer from incorrectly rasterizing line segments that
   cross the camera plane, {@code z = 0}.
*/

//@ts-check
import {format} from "../scene/util/UtilExport.js";
import {Vector, OrthoNorm, PerspNorm, Matrix} from "./SceneExport.js";

export default class Camera
{
    /**@type {number} left the left wall of the view volumne*/ left;
    /**@type {number} right the right wall of the view valumne*/ right;
    /**@type {number} bottom the bottom wall of the view valumne*/ bottom;
    /**@type {number} top the top wall of the view valumne*/ top;
    /**@type {number} n the front wall of the view valumne*/ n;
    /**@type {boolean} perspective whether the camera is projecting ortho or perspective*/ perspective;
    /**@type {Vector} the vector to determine the camera's location in world space */ #viewVector;

    /**
     * Set up this {@code Camera}'s view volume as a specified by {@param} persp
     *
     * @param {number} [l=-1] the left edge of view rectangle in the near plane
     * @param {number} [r=1] the right edge of view rectangle in the near plane
     * @param {number} [b=-1] the bottom edge of view rectangle in the near plane
     * @param {number} [t=1] the top edge of view rectangle in the near plane
     * @param {number} [near=1] the front edge of view rectangle in the near plane, distance from origin to view plane
     * @param {boolean} [persp=true] whether to project perspective or orthographic
     * @param {Vector} [viewVect=new Vector(0, 0, 0)] the vector determining the cameras location in world space 
    */
    constructor(l = -1, r = -l, b = -1, t = -b, near = 1, persp = true, viewVect = new Vector(0, 0, 0))
    {
        if (typeof persp != "boolean")
            throw new Error("Perspective must be a boolean");

        if(persp)
            this.projPerspective(l, r, b, t, near, viewVect);
        else
            this.projOrtho(l, r, b, t, near, viewVect);
    }


    /**
     * Set up this {@code Camera}'s view volume as a perspective projection
     * of an infinite view pyramid extending along the negative z-axis.
     *
     * @param {number} [left=-1] the left edge of view rectangle in the near plane
     * @param {number} [right=-1*left] the right edge of view rectangle in the near plane
     * @param {number} [bottom=-1] the bottom edge of view rectangle in the near plane
     * @param {number} [top=-1*bottom] the top edge of view rectangle in the near plane
     * @param {number} [near=1] the front edge of view rectangle in the near plane, distance from origin to view plane
     * @param {Vector} [viewVect=new Vector(0, 0, 0)] the vector to determine this camears location in world space
     */
    projPerspective(left = -1, right = -1 * left, bottom = -1, top = -1 * bottom, near = 1, viewVect = new Vector(0, 0, 0))
    {
        if (typeof left != "number"   ||
            typeof right != "number"  ||
            typeof bottom != "number" ||
            typeof top != "number"    ||
            typeof near != "number")
                throw new Error("All parameters must be numerical");

        if(viewVect instanceof Vector == false)
            throw new Error("View Vector must be a Vector");

        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
        this.n = -1 * near;
        this.#viewVector = viewVect;

        this.perspective = true;
    }


    /**
     * An alternative way to determine this {@code Camera}'s perspective
       view volume.
       <p>
       Here, the view volume is determined by a vertical "field of view"
       angle and an aspect ratio for the view rectangle in the near plane.

     * @param {number} [fovy=90] angle in the y-direction subtended by the view rectangle in the near plane
     * @param {number} [aspect=1] aspect ratio of the view rectangle in the near plane
     * @param {number} [near=1] distance from the origin to the near plane
     */
    projPerspectiveFOVY(fovy = 90, aspect = 1, near = 1)
    {
        if (typeof fovy != "number"   ||
            typeof aspect != "number" ||
            typeof near != "number")
                throw new Error("FOVY, aspect, and near must be numerical");

        this.top = near * Math.tan((Math.PI/180)*fovy/2);
        this.bottom = -1 * this.top;
        this.right = this.top * aspect;
        this.left = -1 * this.right;
        this.n = -1 * near;
        this.#viewVector = new Vector(0, 0, 0);
        this.perspective = true;

        // why do we call this fucntion? the only difference is the one line this.perspective = true?
        // this.projPerspective(this.left, this.right, this.bottom, this.top, this.near);
    }

    /**
     * Set up this {@code Camera}'s view volume as a perspective projection
     * of an infinite view pyramid extending along the negative z-axis.
     * <p>
     * Use {@code focalLength} to determine the image plane. So the
     * {@code left}, {@code right}, {@code bottom}, {@code top}
     * parameters are used in the plane {@code z = -focalLength}.
     * <p>
     * The {@code focalLength} parameter can be used to zoom an
     * asymmetric view volume, much like the {@code fovy} parameter
     * for the symmetric view volume, or the "near" parameter for
     * the OpenGL gluPerspective() function.
     * 
     * @param {number} [l= -1] the left edge of the view rectangle in the image plane
     * @param {number} [r= -l] the right edge of the view rectangle in the image plane
     * @param {number} [b= -1] the bottom edge of the view rectangle in the image plane
     * @param {number} [t= -b] the top edge of the view rectangle in the image plane
     * @param {number} [fLength=1] the distance from the origin to the image plane
     */
    projPerspectiveFocalLength(l = -1, r = -l, b = -1, t = -b, fLength = 1)
    {
        if(typeof l != "number" || typeof r != "number" ||
            typeof b != "number" || typeof t != "number" ||
            typeof fLength != "number")
                throw new Error("All parameters must be numerical");

        this.perspective = true;
        this.left = l/ fLength;
        this.right = r/fLength;        
        this.bottom = b/fLength;    
        this.top = t/fLength;   
        this.n = -.1;
        this.#viewVector = new Vector(0, 0, 0); 
    }

    /**
     * Set up this {@code Camera}'s view volume as a parallel (orthographic)
       projection of an infinite view parallelepiped extending along the
       z-axis.

     * @param {number} [left=-1] left edge of view rectangle in the xy-plane
     * @param {number} [right=1] right edge of view rectangle in the xy-plane
     * @param {number} [bottom=-1] bottom edge of view rectangle in the xy-plane
     * @param {number} [top=-1] top edge of view rectangle in the xy-plane
     * @param {number} [near=-1] distance from the origin to the near plane
     * @param {Vector} [viewVect=new Vector(0, 0, 0)]  this cameras location in world space
     */
    projOrtho(left = -1, right = 1, bottom = -1, top = 1, near = -1, viewVect = new Vector(0, 0, 0))
    {
        if (typeof left != "number"   ||
            typeof right != "number"  ||
            typeof bottom != "number" ||
            typeof top != "number"    ||
            typeof near != "number")
                throw new Error("All parameters must be numerical");

        if(viewVect instanceof Vector == false)
            throw new Error("View Vector must be a Vector");

        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
        this.n = -1 * near;
        this.#viewVector = viewVect;
        this.perspective = false;
    }


    /**
     * An alternative way to determine this {@code Camera}'s orthographic
     * view volume.
     * <p>
     * Here, the view volume is determined by a vertical "field-of-view"
     * angle and an aspect ratio for the view rectangle in the near plane.

     * @param {number} [fovy=90]  angle in the y direction subtended by the view rectangle in the near plane
     * @param {number} [aspect=1] aspect ratio of the view rectangle in the near plane
     * @param {number} [near=-1] distance from the origin to the near plane
     */
    projOrthoFOVY(fovy = 90, aspect = 1, near = -1)
    {
        if (typeof fovy != "number" || typeof aspect != "number" || typeof near != "number")
            throw new Error("All parameters must be numerical");

        this.top = Math.tan((Math.PI/180)*fovy/2);
        this.bottom = -1 * this.top;
        this.right = this.top * aspect;
        this.left = -1 * this.right;
        this.n = 1;
        this.#viewVector = new Vector(0, 0, 0);
        this.perspective = false;

        // why do we call this fucntion? the only difference is the one line this.perspective = false?
        // this.projPerspective(this.left, this.right, this.bottom, this.top, this.near);
    }

    /**
     * Create a new {@code Camera} that is essentially the same as this
     * {@code Camera} but with the given distance from the camera to
     * the near clipping plane.
     * <p>
     * When {@code near} is positive, the near clipping plane is in
     * front of the camera. When {@code near} is negative, the near
     * clipping plane is behind the camera.
     * 
     * @param {number} near  distance from the new {@code Camera} to its near clipping plane
     * @return {Camera} a new {@code Camera} object with the given value for near
    */
    changeNear(near)
    {
       return new Camera(this.left,
                         this.right,
                         this.bottom,
                         this.top,
                         -near,
                         this.perspective,
                         this.#viewVector);
    }

    /**
     * Create a new {@code Camera} that is essentially the same as
     * this {@code Camera} but with the given location.
     * 
     * @param {number} x  translated location, in the x-direction, for the new {@code Camera}
     * @param {number} y  translated location, in the y-direction, for the new {@code Camera}
     * @param {number} z  translated location, in the z-direction, for the new {@code Camera}
     * @return {Camera} a new {@code Camera} object with the given translated location
    */
    translate(x, y, z)
    {
        return new Camera(this.left,
                        this.right,
                        this.bottom,
                        this.top,
                        this.n,
                        this.perspective,
                        new Vector(x, y, z));  // viewVector
    }

    /**
     * Get a reference to this {@code Camera}'s view {@link Vector}.
     * 
     * @return {Vector} a reference to this {@code Camera}'s {@link Vector} object
    */
    getViewVector()
    {
       return this.#viewVector;
    }
   
   
    /**
       Get a reference to this {@code Camera}'s normalization {@link Matrix}.

       @return {Matrix} a reference to this {@code Camera}'s normalizing {@link Matrix} object
    */
    getNormalizeMatrix()
    {
        if (this.perspective)
           return PerspNorm(this.left, this.right, this.bottom, this.top, this.n);
        else
           return OrthoNorm(this.left, this.right, this.bottom, this.top);
    }

    /**
      For debugging.

      @return {string} representation of this {@code Camera} object
    */
    toString()
    {
        const fovy =  (180/Math.PI) * Math.atan(this.top)
                    + (180/Math.PI) * Math.atan(-this.bottom);
        const ratio = (this.right - this.left) / (this.top - this.bottom);

        let result = "";
        result += "Camera: \n";
        result += "  perspective = " + this.perspective + "\n";
        result += "  left = "   + this.left + ", "
               +  "  right = "  + this.right + "\n"
               +  "  bottom = " + this.bottom + ", "
               +  "  top = "    + this.top + "\n"
               +  "  near = "   + -1 * this.n + "\n"
               +  "  (fovy = " + fovy
               +  format(", aspect ratio = %.2f)", ratio )
               +  "Normalization Matrix\n"
               +  this.getNormalizeMatrix().toString() + "\n"
               +  "Translation Vector\n" 
               +  "  " + this.#viewVector.toString();

        return result;
    }


    /**
     * Method for testing camera class
     */
    static main()
    {
        console.log("Creating cam1 = new Camera()");
        const cam1 = new Camera();
        console.log("cam1: ");
        console.log(cam1.toString());

        console.log("");
        console.log("cam1.projOrtho(-2, 2, -2, 2, 2): ");
        cam1.projOrtho(-2, 2, -2, 2, 2);
        console.log(cam1.toString());

        console.log("");
        console.log("cam1.projPerspFOVY(): ")
        cam1.projPerspectiveFOVY();
        console.log(cam1.toString());

        console.log("");
        console.log("Creating cam2 = new Camera(-4, 4, -4, 4, false)");
        const cam2 = new Camera(-4, 4, -4, 4, 4, false);
        console.log("cam2: ");
        console.log(cam2.toString());

        console.log("");
        console.log("cam2.projPerspective(-3, 3, -3, 3, 3): ");
        cam2.projPerspective(-3, 3, -3, 3, 3);
        console.log(cam2.toString());

        console.log("");
        console.log("cam2.projOrthoFOVY(): ");
        cam2.projOrthoFOVY();
        console.log(cam2.toString());
    }
}