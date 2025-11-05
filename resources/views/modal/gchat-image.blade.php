{{-- Image zoom modal for global chat - displays on top of gchat-simple modal --}}
<div id="gchat-image-modal" class="gchat-image-modal" style="display: none;" role="dialog" aria-labelledby="gchat-image-modal-title" aria-modal="true">
    <div class="gchat-image-modal-backdrop"></div>
    
    <div class="gchat-image-modal-content">
        {{-- Close button --}}
        <button type="button" 
                class="gchat-image-modal-close" 
                data-gchat-image-close
                aria-label="Close image preview">
            <i class="fa fa-times"></i>
        </button>

        {{-- Zoom controls --}}
        <div class="gchat-image-zoom-controls">
            <button type="button" 
                    class="gchat-zoom-btn" 
                    data-gchat-zoom-in
                    aria-label="Zoom in">
                <i class="fa fa-plus"></i>
            </button>
            <button type="button" 
                    class="gchat-zoom-btn" 
                    data-gchat-zoom-out
                    aria-label="Zoom out">
                <i class="fa fa-minus"></i>
            </button>
            <button type="button" 
                    class="gchat-zoom-btn" 
                    data-gchat-zoom-fit
                    aria-label="Fit to screen">
                <i class="fa fa-expand"></i>
            </button>
        </div>

        {{-- Image container --}}
        <div class="gchat-image-container">
            <div class="gchat-image-spinner">
                <i class="fa fa-spinner fa-spin"></i>
            </div>
            <img id="gchat-modal-image" 
                 src="" 
                 alt="Chat image preview" 
                 class="gchat-modal-img"
                 draggable="false">
        </div>
    </div>
</div>
