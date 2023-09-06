/*
 * Renderer Models. The MIT License.
 * Copyright (c) 2022 rlkraft@pnw.edu
 * See LICENSE for details.
*/

/**
   Create a wireframe model of a sphere centered at the origin.
<p>
   See <a href="https://en.wikipedia.org/wiki/Sphere" target="_top">
                https://en.wikipedia.org/wiki/Sphere</a>
<p>
   A sphere of radius {@code r} is the surface of revolution generated by
   revolving a half-circle in the xy-plane with radius {@code r} and center
   {@code (0,0,0)} around the y-axis.
<p>
   Here are parametric equations for the right half-circle in the xy-plane with
   radius {@code r} and center {@code (0,0,0)}, parameterized from the top down.
   <pre>{@code
      x(phi) = r * sin(phi)  \
      y(phi) = r * cos(phi)   |-  0 <= phi <= PI
      z(phi) = 0             /
   }</pre>
   Here is the 3D rotation matrix that rotates around the y-axis
   by {@code theta} radians, {@code 0 <= theta <= 2*PI}
   <pre>{@code
      [ cos(theta)   0   sin(theta)]
      [     0        1       0     ]
      [-sin(theta)   0   cos(theta)]
   }</pre>
   If we multiply the rotation matrix with the half-circle
   parameterization, we get a parameterization of the sphere.
   <pre>{@code
      [ cos(theta)   0   sin(theta)]   [r * sin(phi)]
      [     0        1       0     ] * [r * cos(phi)]
      [-sin(theta)   0   cos(theta)]   [     0      ]

      = ( r * sin(phi) * cos(theta).    \
          r * cos(phi),                  |- 0<=theta<=2*PI,  0<=phi<=PI
         -r * sin(phi) * sin(theta) )   /
   }</pre>
   See
     <a href="https://en.wikipedia.org/wiki/Sphere#Equations_in_three-dimensional_space" target="_top">
              https://en.wikipedia.org/wiki/Sphere#Equations_in_three-dimensional_space</a>

   @see SphereSector
*/
//@ts-check
import {format} from "../scene/util/StringFormat.js";ngFormat.js";
import {SphereSector} from "./ModelsExport.js";

//import {Vertex, LineSegment} from "../scene/SceneExport.js";

export default class Sphere extends SphereSector
{
   // /**@type {number} */ #r;
   // /**@type {number} */ #n;
   // /**@type {number} */ #k;

   /**
      Create a sphere of radius {@code r} centered at the origin.
   <p>
      The last two parameters determine the number of half circles
      of longitude and the number of circles of latitude in the model.
   <p>
      If there are {@code k} half circles of longitude, then each circle
      of latitude will have {@code k} line segments.
      If there are {@code n} circles of latitude, then each half circle
      of longitude will have {@code n+1} line segments.
   <p>
      There must be at least three half circles of longitude and
      at least one circle of latitude.

      @param {number} [r=1]  radius of the sphere
      @param {number} [n=15]  number of circles of latitude
      @param {number} [k=16]  number of half circles of longitude
   */
   constructor(r=1, n=15, k=16)
   {
      super(r, 0, 2*Math.PI, 0, 2*Math.PI, n, k);
      this.name = (format("Sphere(%.2f,%d,%d)", r, n, k));

      /*
      if (n < 1)
         throw new Error("n must be greater than 0");
      if (k < 3)
         throw new Error("k must be greater than 2");

      this.#r = r;
      this.#n = n;
      this.#k = k;

      // Create the sphere's geometry.

      const deltaPhi = Math.PI / (n + 1);
      const deltaTheta = (2 * Math.PI) / k;
      
      */
      // An array of vertices to be used to create line segments.
      // /**@type {Vertex[][]} */
      // const v = new Array(n);
      // for(let i = 0; i < v.length; i += 1)
      //    v[i] = new Array(k);

      /*
      // Create all the vertices.
      for (let j = 0; j < k; ++j) // choose an angle of longitude
      {
         const c1 = Math.cos(j * deltaTheta);
         const s1 = Math.sin(j * deltaTheta);
         for (let i = 0; i < n; ++i) // choose an angle of latitude
         {
            const c2 = Math.cos(deltaPhi + i * deltaPhi);
            const s2 = Math.sin(deltaPhi + i * deltaPhi);
            v[i][j] = new Vertex( r * s2 * c1,
                                  r * c2,
                                 -r * s2 * s1 );
         }
      }
      const northPole = new Vertex(0,  r, 0);
      const southPole = new Vertex(0, -r, 0);

      // this.add all of the vertices to this model.
      for (let i = 0; i < n; ++i)
      {
         for (let j = 0; j < k; ++j)
            this.addVertex( v[i][j] );
      }

      this.addVertex(northPole, southPole);
      const northPoleIndex = n * k;
      const southPoleIndex = northPoleIndex + 1;

      // Create the horizontal circles of latitude around the sphere.
      for (let i = 0; i < n; ++i)
      {
         for (let j = 0; j < k - 1; ++j)
            //                                v[i][j]       v[i][j+1]
            this.addPrimitive(LineSegment.buildVertex( (i * k) + j,  (i * k) + (j+1) ));
         
         // close the circle
         this.addPrimitive(LineSegment.buildVertex( (i * k) + (k-1), (i * k) + 0 ));
      }  //                                v[i][k-1]        v[i][0]

      // Create the vertical half-circles of longitude from north to south pole.
      for (let j = 0; j < k; ++j)
      {  //                                                v[0][j]
         this.addPrimitive(LineSegment.buildVertex( northPoleIndex, (0 * k) + j ));

         for (let i = 0; i < n - 1; ++i)
            //                                v[i][j]      v[i+1][j]
            this.addPrimitive(LineSegment.buildVertex( (i * k) + j, ((i+1) * k) + j ));
         
         //                                 v[n-1][j]
         this.addPrimitive(LineSegment.buildVertex( ((n-1) * k) + j, southPoleIndex ));
      }
      */
   }
}//Sphere
