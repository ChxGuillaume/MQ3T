<script setup lang="ts">
import { ConnectionForm } from '../../assets/js/default-connection'
import type { TableColumn } from '@nuxt/ui'
import { computed } from 'vue'

const connection = defineModel<ConnectionForm>('connection', { required: true })

const isMqtt5 = computed(() => connection.value.protocolVersion === 5)

const userPropertiesColumns: TableColumn<{ key: string; value: string }>[] = [
  { accessorKey: 'key', header: 'Name' },
  { accessorKey: 'value', header: 'Value' },
  { id: 'actions', header: '', meta: { class: { td: 'w-10', th: 'w-10' } } }
]

const addUserProperty = () => {
  connection.value.properties.userProperties.push({ key: '', value: '' })
}

const removeUserProperty = (index: number) => {
  connection.value.properties.userProperties.splice(index, 1)
}
</script>

<template>
  <div class="flex flex-col gap-[22px]">
    <section class="flex flex-col gap-2">
      <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">Session</h2>
      <div class="border-default divide-default divide-y overflow-hidden rounded-lg border">
        <div class="flex flex-wrap items-center gap-3 px-[18px] py-3">
          <div class="min-w-0 flex-[1_1_240px]">
            <b class="block text-[13px] font-semibold">Clean session</b>
            <span class="text-muted mt-0.5 block text-xs">
              Start fresh each time. Turn off to get messages queued while you were away.
            </span>
          </div>
          <USwitch v-model="connection.clean" aria-label="Clean session" />
        </div>

        <div v-if="isMqtt5" class="flex flex-wrap items-center gap-3 px-[18px] py-3">
          <div class="min-w-0 flex-[1_1_240px]">
            <b class="block text-[13px] font-semibold">
              Session expiry
              <span
                class="bg-primary/10 text-primary ml-1.5 rounded-full px-2 py-px text-[11px] font-bold"
              >
                MQTT 5
              </span>
            </b>
            <span class="text-muted mt-0.5 block text-xs">
              How long the broker keeps the session after you disconnect.
            </span>
          </div>
          <UFormField name="properties.sessionExpiryInterval" class="w-[120px]">
            <UInput
              v-model.number="connection.properties.sessionExpiryInterval"
              type="number"
              min="0"
              aria-label="Session expiry"
              :placeholder="connection.clean ? undefined : 'Never expire'"
            />
          </UFormField>
          <span class="text-muted w-6 text-xs">s</span>
        </div>

        <div class="flex flex-wrap items-center gap-3 px-[18px] py-3">
          <div class="min-w-0 flex-[1_1_240px]">
            <b class="block text-[13px] font-semibold">Connect timeout</b>
          </div>
          <UFormField name="connectTimeout" class="w-[120px]">
            <UInput
              v-model.number="connection.connectTimeout"
              type="number"
              min="1"
              aria-label="Connect timeout"
            />
          </UFormField>
          <span class="text-muted w-6 text-xs">s</span>
        </div>

        <div class="flex flex-wrap items-center gap-3 px-[18px] py-3">
          <div class="min-w-0 flex-[1_1_240px]">
            <b class="block text-[13px] font-semibold">Reconnect every</b>
            <span class="text-muted mt-0.5 block text-xs">
              Delay between automatic reconnect attempts.
            </span>
          </div>
          <UFormField name="reconnectPeriod" class="w-[120px]">
            <UInput
              v-model.number="connection.reconnectPeriod"
              type="number"
              min="1"
              aria-label="Reconnect period"
            />
          </UFormField>
          <span class="text-muted w-6 text-xs">s</span>
        </div>
      </div>
    </section>

    <p v-if="!isMqtt5" class="bg-muted text-muted rounded-md px-3 py-2 text-[13px]">
      Limits, session expiry and user properties need MQTT 5.0. Change the MQTT version in the
      General section to use them.
    </p>

    <template v-else>
      <section class="flex flex-col gap-2">
        <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
          Limits
          <span
            class="bg-primary/10 text-primary ml-1.5 rounded-full px-2 py-px text-[11px] font-bold tracking-normal normal-case"
          >
            MQTT 5
          </span>
        </h2>
        <div class="border-default divide-default divide-y overflow-hidden rounded-lg border">
          <div class="flex flex-wrap items-center gap-3 px-[18px] py-3">
            <div class="min-w-0 flex-[1_1_240px]">
              <b class="block text-[13px] font-semibold">Receive maximum</b>
              <span class="text-muted mt-0.5 block text-xs">
                Messages the broker may send before you acknowledge them.
              </span>
            </div>
            <UFormField name="properties.receiveMaximum" class="w-[120px]">
              <UInput
                v-model.number="connection.properties.receiveMaximum"
                type="number"
                min="0"
                placeholder="65535"
                aria-label="Receive maximum"
              />
            </UFormField>
            <span class="w-6" />
          </div>

          <div class="flex flex-wrap items-center gap-3 px-[18px] py-3">
            <div class="min-w-0 flex-[1_1_240px]">
              <b class="block text-[13px] font-semibold">Maximum packet size</b>
            </div>
            <UFormField name="properties.maximumPacketSize" class="w-[120px]">
              <UInput
                v-model.number="connection.properties.maximumPacketSize"
                type="number"
                min="0"
                placeholder="No limit"
                aria-label="Maximum packet size"
              />
            </UFormField>
            <span class="text-muted w-6 text-xs">B</span>
          </div>

          <div class="flex flex-wrap items-center gap-3 px-[18px] py-3">
            <div class="min-w-0 flex-[1_1_240px]">
              <b class="block text-[13px] font-semibold">Request response information</b>
            </div>
            <USwitch
              v-model="connection.properties.requestResponseInformation"
              aria-label="Request response information"
            />
          </div>

          <div class="flex flex-wrap items-center gap-3 px-[18px] py-3">
            <div class="min-w-0 flex-[1_1_240px]">
              <b class="block text-[13px] font-semibold">Request problem information</b>
              <span class="text-muted mt-0.5 block text-xs">
                Get a reason string when the broker rejects something.
              </span>
            </div>
            <USwitch
              v-model="connection.properties.requestProblemInformation"
              aria-label="Request problem information"
            />
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <div class="flex items-center">
          <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
            User properties
            <span
              class="bg-primary/10 text-primary ml-1.5 rounded-full px-2 py-px text-[11px] font-bold tracking-normal normal-case"
            >
              MQTT 5
            </span>
          </h2>
          <UButton
            icon="i-lucide-plus"
            label="Add"
            variant="link"
            size="sm"
            class="ml-auto font-semibold"
            @click="addUserProperty"
          />
        </div>
        <div class="border-default overflow-hidden rounded-lg border">
          <UTable
            :data="connection.properties.userProperties"
            :columns="userPropertiesColumns"
            empty="No user properties"
            :ui="{
              th: 'text-muted px-[18px] py-2 text-[11px] font-semibold tracking-[0.08em] uppercase',
              td: 'px-[18px] py-1.5 text-[13px]',
              empty: 'text-muted py-4 text-[13px]'
            }"
          >
            <template #key-cell="{ row }">
              <UFormField :name="`properties.userProperties.${row.index}.key`">
                <UInput
                  v-model="connection.properties.userProperties[row.index].key"
                  variant="ghost"
                  placeholder="name"
                  aria-label="Property name"
                  class="w-full font-mono"
                />
              </UFormField>
            </template>
            <template #value-cell="{ row }">
              <UInput
                v-model="connection.properties.userProperties[row.index].value"
                variant="ghost"
                placeholder="value"
                aria-label="Property value"
                class="w-full font-mono"
              />
            </template>
            <template #actions-cell="{ row }">
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                class="text-muted"
                :aria-label="`Remove ${row.original.key || 'property'}`"
                @click="removeUserProperty(row.index)"
              />
            </template>
          </UTable>
        </div>
      </section>
    </template>
  </div>
</template>
