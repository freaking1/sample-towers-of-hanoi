function Surface (jelem, width, height) {
    this.jelem    = jelem;
    this.width    = width;
    this.height   = height;
    this.elems    = new Array ();
    this.xscale   = 1;
    this.yscale   = 1;
    this.duration = 301;
    this.animate  = true;

    // public instance functions
    
    // Add an element to the surface
    // jelem:  jQuery object representing the DOM element
    // x,y:    Top left corner (virtual coordinates)
    // w,h:    Width and height of the element in (virtual coordinate sizes)
    // return: An integer representing the created surface element
    this.Add_Elem = function (jelem, x, y, w, h) {
        var elem = {jelem:jelem, x:x, y:y, w:w, h:h};
        // try to find an empty slot
        for (var i = 0; i < this.elems.length; ++i) {
            if (typeof this.elems [i] === 'undefined') {
                this.elems [i] = elem;
                return i;
            }
        }
        // couldn't find an empty slot, so add to the end
        this.elems.push (elem);
        return this.elems.length - 1;
    };
    
    // Remove an element from the surface
    // ielem: index of the element to be removed.  This must be a value returned by Add_Elem
    this.Remove_Elem = function (ielem) {
        delete this.elems [ielem];
    }
    
    this.Image = function () {
        var str = "";
        for (var i = 0; i < this.elems.length; ++i) {
            str += i + ". ";
            str += Elem_Image (this, i) + "\n";
        }
        return str;
    };

    // Sets the scaling of the virtual coordinates to actual pixel positions on the screen
    // pwidth,pheight:  Pixel width and height of the surface that the virtual coordinates must be mapped to
    this.Set_Scale = function (pwidth, pheight) {
        this.xscale = pwidth / this.width;
        this.yscale = pheight / this.height;
    };
    
    // Positions all the element added to the surface based on the current scaling
    this.Position_All = function () {
        for (var i = 0; i < this.elems.length; ++i) {
            if (typeof this.elems [i] === 'undefined') {
                continue;
            }
            var elem = this.elems [i];
            elem.jelem.offset ({top: elem.y*this.yscale, left: elem.x*this.xscale});
            elem.jelem.width (elem.w*this.xscale);
            elem.jelem.height (elem.h*this.yscale);
        }
    };

    // Move an element from it's current position to a new one
    // to_x, to_y:  The virtual coordinates to move the element to
    // callback:    a function to be called when the move has occured.  This is relevant
    //              when the move is animated and not happening instantly
    this.Move_Elem = function (ielem, to_x, to_y, callback) {
        var pto_x = this.xscale * to_x;
        var pto_y = this.yscale * to_y;
        var options;
        if (typeof callback === 'undefined') {
            options = {duration:this.duration};
        }
        else {
            options = {duration:this.duration, complete:callback};
        }
        if (this.animate === true) {
            this.elems [ielem].jelem.animate ({left:pto_x, top:pto_y}, options);
        }
        else {
            this.elems [ielem].jelem.offset ({left:pto_x, top:pto_y});
        }
        this.elems [ielem].x = to_x;
        this.elems [ielem].y = to_y;
        if (this.animate === false && typeof callback !== 'undefined') {
            callback ();
        }
    };
    
    this.Get_Elem = function (ielem) {
        return this.elems [ielem];
    };
    
    // Change the duration of the animation of a move
    // offset:  The change to the current duration in milliseconds.  The initial duration is 300ms
    this.Change_Duration = function (offset) {
        if (this.duration > -offset) {
            this.duration += offset;
        }        
    }

    // private functions
    
    var Elem_Image = function (that, ielem) {
        var img =
             "x:" + that.elems [ielem].x + " y:" + that.elems [ielem].y + 
            " w:" + that.elems [ielem].w + " h:" + that.elems [ielem].h;
        return img;
    };
    
}

$(document).ready (function () {

    var number_of_discs = 10;
    var colors = ['blue', 'orange', 'crimson', 'darkblue', 'darkgreen', 'indianred', 'lime', 'navy', 'salmon', 'tomato', 'yellow', 'steelblue', 'goldenrod', 'peachpuff'];
    
    // create the jquery object corresponding to the DOM element holding the virtual coordinate system
    var jsurface = $("#surface");
    // create the surface object.  Choosing a 30x30 coordinate system
    var surface  = new Surface (jsurface, 30, 30);
    var pins     = new Array (3);
    var queue    = new Array ();
    var state    = 'stopped';
    var discs;

    function write_title(){
      $("<div>Tower Of Hanoi</div>").addClass("toh_title").appendTo (jsurface);
    }
    function Create_Pins () {
        // create the jQuery object correspoding to the pins and plates
 
        var jplate1 = $("<div></div>").addClass ("plate").appendTo (jsurface);
        var jplate2 = $("<div></div>").addClass ("plate").appendTo (jsurface);
        var jplate3 = $("<div></div>").addClass ("plate").appendTo (jsurface);
        var jpin1 = $("<div></div>").addClass ("pin").appendTo (jsurface);
        var jpin2 = $("<div></div>").addClass ("pin").appendTo (jsurface);
        var jpin3 = $("<div></div>").addClass ("pin").appendTo (jsurface);       
        // Add the pins to the surface
    
	var plate1 = surface.Add_Elem (jplate1, 1, 24, 8, 1);
        var plate2 = surface.Add_Elem (jplate2, 11, 24, 8, 1);
        var plate3 = surface.Add_Elem (jplate3, 21, 24, 8, 1);
	var pin1 = surface.Add_Elem (jpin1, 4.6,  5, 0.8, 19.5);
        var pin2 = surface.Add_Elem (jpin2, 14.6, 5, 0.8, 19.5);
        var pin3 = surface.Add_Elem (jpin3, 24.6, 5, 0.8, 19.5);	   
	   }

    function Create_Discs (disc_count) {
        var max_width  = 7;
        var min_width  = 3;
        var width_step = (max_width - min_width)/(disc_count - 1);
        var x_step     = width_step/2;
	var height     = 2.6;  //20/disc_count; ////(total_discs_height/disc_count > max_height) ? max_height : total_discs_height/disc_count;
	var width      = max_width;
        var x          = 1.5;
        var y          = 24.5- height;
        var discs = new Array ();
        for (var i = 0; i < disc_count; ++i) {
            var disc = $("<div></div>").addClass ("oval"); //.css('background-color', colors [i]);
            disc.appendTo (jsurface);
            discs.push (surface.Add_Elem (disc, x, y, width, height));
            x = x + x_step;
            width = width - width_step;
            y = y - height/1.5;
        }
        return discs;
    }

    function Create_Control (img, handler) {
        var control = $("<img>");
        control.get(0).src = img;
        control.addClass ("control").appendTo (jsurface).click (handler);
       // control.bind ("mousedown touchstart", function () { $(this).addClass ("button_down"); });
       // control.bind ("mouseup touchend", function () { $(this).removeClass ("button_down"); });
        return control;
    }
    
    function Create_Controls () {
        surface.Add_Elem (Create_Control ("images/Image_PlayStart.png", Reset), 1.5, 27.5, 1.0, 1.0);
        surface.Add_Elem (Create_Control ("images/Image_Play.png", Start), 4.5, 27.5, 1.0, 1.0);
        surface.Add_Elem (Create_Control ("images/Image_Stop.png", Stop), 7.5, 27.5, 1.0, 1.0);
        surface.Add_Elem (Create_Control ("images/Image_Slow.png",Slower ), 13.5, 27.5, 1.0, 1.0);
        surface.Add_Elem (Create_Control ("images/Image_Fast.png", Faster), 16.5, 27.5, 1.0, 1.0);
        surface.Add_Elem (Create_Control ("images/Image_AddDisk.png", Add1), 23.5, 27.5, 1.0, 1.0);
        surface.Add_Elem (Create_Control ("images/Image_RemoveDisk.png", Sub1), 26.5, 27.5, 1.0, 1.0);
    }
            
    function Resize (width, height) {
		jsurface.width (width);
		jsurface.height (height);
		surface.Set_Scale (width, height);
	    surface.Position_All ();
    }
    
    function Resize_To_Window () {
        Resize ($(window).width(), $(window).height());
    }

    function Move_Disc (from_pin, to_pin, callback) {
        var from_pin_discs = pins [from_pin];
        var from_top_disc  = pins [from_pin].pop ();
        var x_move         = (to_pin - from_pin)*10;
        var elem           = surface.Get_Elem (from_top_disc);
        
        pins [to_pin].push (from_top_disc);
        surface.Move_Elem (from_top_disc, elem.x, 5-elem.h/1.5);
        surface.Move_Elem (from_top_disc, elem.x + x_move, 5 - elem.h/1.5);
        surface.Move_Elem (from_top_disc, elem.x, 23.5 - elem.h/1.5*(pins[to_pin].length), callback);
    }
    
    function Move_Disc_Queue (from_pin, to_pin) {
        queue.push ({from:from_pin, to:to_pin});
    }
    
    function Process_Queue () {
        if (queue.length > 0 && state == 'running') {
            var elem = queue.shift ();
            Move_Disc (elem.from, elem.to, Process_Queue);
        }
    }

    function Move_Stack (size, from, to, middle) {
        if (size == 1) {
            Move_Disc_Queue (from, to);
        }
        else {
            Move_Stack (size-1, from, middle, to);
            Move_Disc_Queue (from, to);
            Move_Stack (size-1, middle, to, from);
        }
    }

    function Remove_Discs () {
        if (typeof discs !== 'undefined') {
            for (var i = 0; i < discs.length; ++i) {
                var elem = surface.Get_Elem (discs [i]);
                elem.jelem.remove();
                surface.Remove_Elem (discs [i]);
            }
            delete discs;
        }
    }
    
    // Control handlers
    
    function Start () {
        if (state == 'stopped') {
            state = 'running';
            Process_Queue ();  // get the queue going again
        }
    }
    
    function Stop () {
        state = 'stopped';
    }
        
    function Reset () {
        state = 'stopped';
        Remove_Discs ();
        discs    = Create_Discs (number_of_discs);
        pins [0] = discs.slice (0);  // create a clone of the discs array
        pins [1] = new Array ();
        pins [2] = new Array ();
        Resize_To_Window ();
        delete queue;
        queue = new Array ();
        Move_Stack (pins [0].length, 0, 2, 1);  // fill up the move queue
    }

    function Faster () {
        surface.Change_Duration (-50);
    }
    
    function Slower () {
        surface.Change_Duration (50);
    }
    
    function Add1 () {
        if (state == 'stopped') {
            if (number_of_discs < 10) {
                number_of_discs += 1;
            }
            Reset ();
        }
    }
    
    function Sub1 () {
        if (state == 'stopped') {
            if (number_of_discs > 2) {
                number_of_discs -= 1;
            }
            Reset ();
        }
    }
    
    function Initialize () {
      write_title();
        // Create the pins
        Create_Pins ();
        
        // Create the controls
        Create_Controls ();

        // Create the discs and reset them
        Reset ();
                        
        // do the initial sizing and positioning
        Resize_To_Window ();

        // setup handler to be called when window is resized
        $(window).resize (Resize_To_Window);
        $(window).bind ('orientationchange', Resize_To_Window);
    }

    Initialize ();
    
    Process_Queue ();
    
});
