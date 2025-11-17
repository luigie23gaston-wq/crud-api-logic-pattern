<!-- Edit Project Modal -->
<div x-show="showEditModal" 
     x-cloak
     @click.self="showEditModal = false"
     @keydown.escape.window="showEditModal = false"
     style="z-index: 999999 !important;"
     class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center overflow-y-auto">
    <div @click.stop style="z-index: 1000000 !important;" class="bg-white rounded-xl max-w-lg w-full mx-4 my-8 shadow-2xl overflow-hidden relative">
      
      <!-- Modal Header -->
      <div class="bg-gradient-to-r from-green-500 to-purple-600 px-6 py-4 flex justify-between items-center">
        <h3 class="text-xl font-bold text-white flex items-center gap-2" id="edit-modal-title">
          <i class="fas fa-edit"></i> Edit Project
        </h3>
        <button type="button" 
                class="text-white hover:text-gray-200 transition-colors p-1" 
                @click="showEditModal = false"
                aria-label="Close">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <form @submit.prevent="updateProject" id="editProjectForm">
          <div class="form-group">
            <label class="form-label" for="editProjectName">
              Project Name <span class="text-red-500">*</span>
            </label>
            <input 
              id="editProjectName" 
              x-model="editingProject.name"
              type="text" 
              class="form-input"
              :class="{ 'border-red-500': errors.name }"
              placeholder="Enter project name"
              required
            >
            <template x-if="errors.name">
              <p class="text-red-500 text-sm mt-1" x-text="errors.name[0]"></p>
            </template>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="editProjectDescription">
              Description
            </label>
            <textarea 
              id="editProjectDescription" 
              x-model="editingProject.description"
              rows="4" 
              class="form-textarea"
              :class="{ 'border-red-500': errors.description }"
              placeholder="Enter project description (optional)"
            ></textarea>
            <template x-if="errors.description">
              <p class="text-red-500 text-sm mt-1" x-text="errors.description[0]"></p>
            </template>
          </div>
        </form>
      </div>

      <!-- Modal Footer -->
      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
        <button type="button" 
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors" 
                @click="showEditModal = false">
          Cancel
        </button>
        <button type="submit" 
                form="editProjectForm"
                class="px-4 py-2 bg-gradient-to-r from-green-500 to-purple-600 text-white rounded-lg hover:from-green-600 hover:to-purple-700 transition-all flex items-center gap-2">
          <i class="fas fa-save"></i> Save Changes
        </button>
      </div>
    </div>
</div>
