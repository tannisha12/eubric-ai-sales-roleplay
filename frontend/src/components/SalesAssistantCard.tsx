import { useId, useState } from "react";
import { PRODUCT_FAQ, PRODUCT_SECTIONS } from "../data/productKnowledge";
import type { PersonaConfig } from "../types/persona";

interface SalesAssistantCardProps {
  persona: PersonaConfig;
}

type TabId = "persona" | "product" | "faq";

const TABS: { id: TabId; label: string }[] = [
  { id: "persona", label: "Persona" },
  { id: "product", label: "Product" },
  { id: "faq", label: "FAQ" },
];

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`accordion__chevron ${expanded ? "accordion__chevron--expanded" : ""}`}
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m6 9 6 6 6-6"
      />
    </svg>
  );
}

interface AccordionEntry {
  id: string;
  title: string;
  body: React.ReactNode;
}

function SingleExpandAccordion({
  items,
  openId,
  onToggle,
}: {
  items: AccordionEntry[];
  openId: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="accordion">
      {items.map((item) => {
        const isOpen = item.id === openId;
        return (
          <div className={`accordion__item ${isOpen ? "accordion__item--open" : ""}`} key={item.id}>
            <button
              type="button"
              className="accordion__trigger"
              onClick={() => onToggle(item.id)}
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <ChevronIcon expanded={isOpen} />
            </button>
            {isOpen && <div className="accordion__body">{item.body}</div>}
          </div>
        );
      })}
    </div>
  );
}

function KvRow({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }
  return (
    <div className="kv-row">
      <span className="kv-row__label">{label}</span>
      <p className="kv-row__value" title={value}>
        {value}
      </p>
    </div>
  );
}

interface PersonaGroup {
  title: string;
  rows: { label: string; value?: string }[];
}

function PersonaTab({ persona }: { persona: PersonaConfig }) {
  const groups: PersonaGroup[] = [
    {
      title: "Company",
      rows: [
        { label: "Company", value: persona.companyName },
        { label: "Role", value: persona.role },
      ],
    },
    {
      title: "Deal Signals",
      rows: [
        { label: "Budget", value: persona.budget },
        { label: "Decision Style", value: persona.decisionStyle },
        { label: "Buying Motivation", value: persona.buyingMotivation },
      ],
    },
    {
      title: "Conversation Hooks",
      rows: [
        { label: "Responsibilities", value: persona.mainResponsibilities },
        { label: "Challenges", value: persona.currentChallenges },
        { label: "Pain Points", value: persona.painPoints },
        { label: "Success Metrics", value: persona.successMetrics },
      ],
    },
  ];

  return (
    <div className="kv-groups">
      {groups.map((group) => (
        <div className="kv-group" key={group.title}>
          <span className="eyebrow kv-group__title">{group.title}</span>
          <div className="kv-list">
            {group.rows.map((row) => (
              <KvRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductTab() {
  const [openId, setOpenId] = useState<string | null>(PRODUCT_SECTIONS[0]?.id ?? null);

  const items: AccordionEntry[] = PRODUCT_SECTIONS.map((section) => ({
    id: section.id,
    title: section.title,
    body: (
      <>
        {section.intro && <p className="accordion__intro">{section.intro}</p>}
        <ul className="accordion__bullets">
          {section.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </>
    ),
  }));

  return (
    <SingleExpandAccordion
      items={items}
      openId={openId}
      onToggle={(id) => setOpenId((prev) => (prev === id ? null : id))}
    />
  );
}

function FaqTab() {
  const [openId, setOpenId] = useState<string | null>(null);

  const items: AccordionEntry[] = PRODUCT_FAQ.map((item) => ({
    id: item.id,
    title: item.question,
    body: <p className="accordion__answer">{item.answer}</p>,
  }));

  return (
    <SingleExpandAccordion
      items={items}
      openId={openId}
      onToggle={(id) => setOpenId((prev) => (prev === id ? null : id))}
    />
  );
}

export function SalesAssistantCard({ persona }: SalesAssistantCardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("persona");
  const tabsId = useId();

  return (
    <div className="card sales-assistant-card">
      <h3 className="card__title">Sales Assistant</h3>

      <div className="sales-assistant__tabs" role="tablist" aria-label="Sales assistant">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${tabsId}-${tab.id}`}
            aria-selected={activeTab === tab.id}
            className={`sales-assistant__tab ${
              activeTab === tab.id ? "sales-assistant__tab--active" : ""
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sales-assistant__panel" role="tabpanel" aria-labelledby={`${tabsId}-${activeTab}`}>
        {activeTab === "persona" && <PersonaTab persona={persona} />}
        {activeTab === "product" && <ProductTab />}
        {activeTab === "faq" && <FaqTab />}
      </div>
    </div>
  );
}
