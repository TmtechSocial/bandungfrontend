<script>
  import { isCollapsed } from '$lib/stores/sidebarStore';
  import { goto } from '$app/navigation';

  let hoveredItem = null;
  let isLogoutHovered = false;
  let isArrowHovered = false;
  let isLoggingOut = false;

  const menuItems = [
    { label: 'Dashboard', iconPath: '/images/dashboardIcon.svg', iconHoverPath: '/images/dashboardHoverIcon.svg', url: '/dashboard' },
    { label: 'Task', iconPath: '/images/taskIcon.svg', iconHoverPath: '/images/taskHoverIcon.svg', url: '/task' },
    { label: 'Report', iconPath: '/images/reportIcon.svg', iconHoverPath: '/images/reportHoverIcon.svg', url: '/report' },
    { label: 'Request', iconPath: '/images/homeIcon.svg', iconHoverPath: '/images/homeHoverIcon.svg', url: '/home' },
  ];

  const toggleSidebar = () => {
    isCollapsed.update(value => !value);
  };

  const handleLogout = async () => {
    try {
      isLoggingOut = true;

      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      isLoggingOut = false;
    }
  };
</script>

<div class="fixed left-0 top-0 h-screen">
  <div class="pl-4 pt-3 pb-4 h-full">
    <div 
      class="bg-myPrimary h-full rounded-3xl flex flex-col justify-between transition-[width] duration-500 ease-in-out"
      style="width: {$isCollapsed ? '5rem' : '11rem'}"
    >
      <div>
        <div class="pt-5 flex items-center relative" class:pl-4={!$isCollapsed}>
          <div class="flex items-center absolute left-0 right-0 px-4">
            <div 
              class="overflow-hidden transition-[width,opacity] duration-300 ease-in-out opacity-100 flex-shrink-0 ps-1"
              style="width: {$isCollapsed ? '0' : '89px'}; opacity: {$isCollapsed ? '0' : '1'}"
            >
              <img 
                src="/favicon.svg"
                alt="mirorim" 
                width="100" 
                height="50" 
                class="object-contain"
              />
            </div>
            <button
              type="button"
              class="border-2 border-third rounded-lg p-1 cursor-pointer hover:bg-third transition-all duration-500 flex-shrink-0 ml-auto w-[30px] h-[30px] flex items-center justify-center"
              class:rotate-180={$isCollapsed}
              on:click={toggleSidebar}
              on:mouseenter={() => isArrowHovered = true}
              on:mouseleave={() => isArrowHovered = false}
              aria-label="Toggle Sidebar"
            >
              <img
                src={isArrowHovered ? "/images/arrowSideBarHoverIcon.svg" : "/images/arrowSideBar.svg"}
                alt="sidebar toggle"
                class="w-5 h-5"
              />
            </button>
          </div>
        </div>
        <div class="pt-10">
          <ul class="px-3 font-semibold uppercase text-xs text-third space-y-2">
            {#each menuItems as item, index}
              <li
                class="flex items-center cursor-pointer transition-all hover:bg-third hover:text-myPrimary hover:font-bold hover:rounded-lg p-3"
                class:justify-center={$isCollapsed}
                class:text-myPrimary={hoveredItem === index}
                class:pointer-events-none={item.isLogout && isLoggingOut}
                on:mouseenter={() => hoveredItem = index}
                on:mouseleave={() => hoveredItem = null}
                on:click={() => item.isLogout ? handleLogout() : window.location.href = item.url}
              >
                <div class="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                  <img
                    src={hoveredItem === index ? item.iconHoverPath : item.iconPath}
                    alt={item.label.toLowerCase()}
                    class="w-full h-full object-contain"
                  />
                </div>
                <div 
                  class="overflow-hidden transition-[width,opacity] duration-300 ease-in-out"
                  style="width: {$isCollapsed ? '0' : '100%'}; opacity: {$isCollapsed ? '0' : '1'}"
                >
                  <span class="ml-3 whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>