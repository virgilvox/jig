<template>
  <div class="flex flex-col gap-5">
    <form class="flex items-end gap-2" @submit.prevent="invite">
      <div class="flex-1">
        <UiFormField label="Invite by email" for="invite-email">
          <template #default="{ id }">
            <UiInput
              :id="id"
              v-model="inviteEmail"
              type="email"
              placeholder="teammate@example.com"
            />
          </template>
        </UiFormField>
      </div>
      <UiSelect v-model="inviteRole" :options="roleOptions" aria-label="Role" class="w-32" />
      <UiButton type="submit" :disabled="inviting || !inviteEmail.trim()">
        {{ inviting ? "Inviting..." : "Invite" }}
      </UiButton>
    </form>

    <div>
      <h3 class="mb-2 font-display text-sm font-semibold text-muted">Members</h3>
      <UiTable :columns="['Member', 'Role', '']">
        <tr v-for="m in members" :key="m.id">
          <td>
            {{ m.user.name || m.user.email }}
            <p v-if="m.user.name" class="text-sm text-muted">{{ m.user.email }}</p>
          </td>
          <td class="text-muted">{{ m.role }}</td>
          <td class="text-right">
            <UiButton v-if="m.role !== 'owner'" variant="ghost" @click="remove(m.user.email)">
              Remove
            </UiButton>
          </td>
        </tr>
      </UiTable>
    </div>

    <div v-if="invites.length">
      <h3 class="mb-2 font-display text-sm font-semibold text-muted">Pending invitations</h3>
      <UiTable :columns="['Email', 'Role', '']">
        <tr v-for="inv in invites" :key="inv.id">
          <td>{{ inv.email }}</td>
          <td class="text-muted">{{ inv.role || "member" }}</td>
          <td class="text-right">
            <UiButton variant="ghost" @click="cancel(inv.id)">Cancel</UiButton>
          </td>
        </tr>
      </UiTable>
    </div>
  </div>
</template>

<script setup lang="ts">
type Member = { id: string; role: string; user: { email: string; name: string } }
type Invite = { id: string; email: string; role: string | null; status: string }

const props = defineProps<{ organizationId: string }>()
const { push } = useToast()

const members = ref<Member[]>([])
const invites = ref<Invite[]>([])
const inviteEmail = ref("")
const inviteRole = ref("member")
const inviting = ref(false)

const roleOptions = [
  { label: "Member", value: "member" },
  { label: "Admin", value: "admin" },
]

async function load(): Promise<void> {
  const full = await authClient.organization.getFullOrganization({
    query: { organizationId: props.organizationId },
  })
  const data = full.data
  members.value = (data?.members ?? []) as Member[]
  invites.value = ((data?.invitations ?? []) as Invite[]).filter((i) => i.status === "pending")
}

onMounted(load)
watch(() => props.organizationId, load)

async function invite(): Promise<void> {
  const email = inviteEmail.value.trim()
  if (!email) return
  inviting.value = true
  const { error } = await authClient.organization.inviteMember({
    email,
    role: inviteRole.value as "member" | "admin",
    organizationId: props.organizationId,
  })
  inviting.value = false
  if (error) {
    push({
      title: "Could not invite",
      description: error.message ?? "They may already be a member.",
      variant: "danger",
    })
    return
  }
  inviteEmail.value = ""
  await load()
  push({ title: "Invitation sent" })
}

async function remove(emailOrId: string): Promise<void> {
  const { error } = await authClient.organization.removeMember({
    memberIdOrEmail: emailOrId,
    organizationId: props.organizationId,
  })
  if (error) {
    push({ title: "Could not remove member", variant: "danger" })
    return
  }
  await load()
}

async function cancel(invitationId: string): Promise<void> {
  const { error } = await authClient.organization.cancelInvitation({ invitationId })
  if (error) {
    push({ title: "Could not cancel invitation", variant: "danger" })
    return
  }
  await load()
}
</script>
