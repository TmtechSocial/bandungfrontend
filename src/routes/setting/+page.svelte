<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { fetchUserGroups,fetchUser } from '../camunda/camundaUserGroups.js';

  export let data;
  const sessionData = data?.sessionData || {};

  let groupIds = [];
  let initiatorId = sessionData.user?.username;

  const userSession = writable({
    fid: sessionData.user?.fullName,
    tid: sessionData.user?.lastName,
    uid: initiatorId,
    saldo_cuti: sessionData.user?.saldo_cuti || 0
  });
let ldapData = {}
  onMount(async () => {
    try {
      const user = await fetchUser(initiatorId)
      ldapData = user;
	console.log('users: ', user)
    } catch (error) {
      ldapData = {};
    }
    }
  )
  onMount(async () => {
    console.log("User Session Loaded:", sessionData);

    try {
      const groups = await fetchUserGroups(initiatorId);

      if (Array.isArray(groups) && groups.length > 0) {
        groupIds = groups.map((g) => g.id);
      } else {
        console.log(
          `No Camunda groups found for user ${initiatorId}; using empty group list`
        );
        groupIds = [];
      }
    } catch (err) {
      console.error(`Error fetching groups for ${initiatorId}:`, err.message || err);
      groupIds = [];
    }
  });
</script>


<div class="container mx-auto p-2 sm:p-4">
  <div class="rounded-lg w-full h-auto bg-myPrimary text-white p-4 sm:p-6 mb-4 shadow-md">
    
    <!-- Mobile Layout (Stack) -->
    <div class="block space-y-3">
      
      <div class="border-b border-white/20 pb-2">
        <p class="text-sm font-medium text-white/80 mb-1">ID</p>
        <p class="text-lg font-bold">{$userSession.uid || '-'}</p>
      </div>

      <div class="border-b border-white/20 pb-2">
        <p class="text-sm font-medium text-white/80 mb-1">Username</p>
        <p class="text-lg font-bold break-words">{$userSession.fid || '-'}</p>
      </div>
      <div class="border-b border-white/20 pb-2">
        <p class="text-sm font-medium text-white/80 mb-1">attendance Status</p>
        <p class="text-lg font-bold break-words">{ldapData.attendanceStatus}</p>
      </div>
      <div class="border-b border-white/20 pb-2">
        <p class="text-sm font-medium text-white/80 mb-1">No Telp</p>
        <p class="text-lg font-bold">{$userSession.tid || '-'}</p>
      </div>

      <div>
        <p class="text-sm font-medium text-white/80 mb-1">Role</p>
        <p class="text-lg font-bold break-words">
          {groupIds.length > 0 ? groupIds.join(', ') : '-'}
        </p>
      </div>

      <div class="pt-2">
        <a
          href="/form?process=HR_Management.Manage_Password"
          class="text-sm text-white underline hover:text-blue-200 transition-colors"
        >
          Change Password
        </a>
      </div>
      
    </div>
  </div>
</div>
