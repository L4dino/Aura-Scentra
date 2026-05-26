import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { isCodigoNhoguistaAprovado } from "@/lib/nhoguista";
import { useCart, useReferral } from "@/lib/store";
import { formatMZN } from "@/lib/format";
import { Trash2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { buildWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/carrinho")({
  component: Carrinho,
});

const PROVINCIAS = ["Maputo","Matola","Gaza","Inhambane","Sofala","Manica","Tete","Zambézia","Nampula","Cabo Delgado","Niassa"];

function Carrinho() {
  const { items, remove, setQty, total, clear } = useCart();
  const ref = useReferral((s) => s.ref);
  const [refAprovado, setRefAprovado] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!ref) {
      setRefAprovado(null);
      return;
    }
    void isCodigoNhoguistaAprovado(ref).then((ok) => setRefAprovado(ok ? ref : null));
  }, [ref]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [provincia, setProvincia] = useState("");
  const [bairro, setBairro] = useState("");
  const [pagamento, setPagamento] = useState("whatsapp");
  const [submitting, setSubmitting] = useState(false);

  const checkout = async () => {
    if (!nome.trim() || !provincia || !bairro.trim()) {
      toast.error("Preencha nome, província e bairro");
      return;
    }
    if (items.length === 0) return;
    setSubmitting(true);
    const localizacao = `${provincia} - ${bairro}`;
    const { data: { user } } = await supabase.auth.getUser();

    const nhoguistaCodigo = refAprovado;

    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        user_id: user?.id ?? null,
        nome_cliente: nome,
        telefone,
        total: total(),
        nhoguista_codigo: nhoguistaCodigo,
        status: "pendente",
      })
      .select("id")
      .single();

    if (pedidoError) {
      toast.error(pedidoError.message);
      setSubmitting(false);
      return;
    }

    const { error: itensError } = await supabase.from("pedido_itens").insert(
      items.map((i) => ({
        pedido_id: pedido.id,
        produto_id: i.produto.id,
        quantidade: i.qty,
        preco: i.produto.preco,
        localizacao,
      })),
    );

    if (itensError) {
      await supabase.from("pedidos").delete().eq("id", pedido.id);
      toast.error(itensError.message);
      setSubmitting(false);
      return;
    }
    const msg = buildWhatsAppMessage(items, { nome, localizacao, telefone, ref: refAprovado });
    window.open(whatsappLink(msg), "_blank");
    clear();
    toast.success("Pedido enviado! Continuando no WhatsApp.");
    setSubmitting(false);
    navigate({ to: "/" });
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">O seu carrinho está vazio</h1>
        <p className="mt-2 text-muted-foreground">Explore o catálogo e descubra fragrâncias únicas.</p>
        <Link to="/catalogo" className="mt-6 inline-block rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground">
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.5fr_1fr]">
      <div>
        <h1 className="font-display text-3xl">Carrinho</h1>
        <div className="mt-6 space-y-3">
          {items.map((i) => (
            <div key={i.produto.id} className="flex gap-4 rounded-xl border border-border/60 bg-card p-3">
              <div className="h-24 w-24 overflow-hidden rounded-md bg-black/40">
                {i.produto.imagem_url && <img src={i.produto.imagem_url} alt={i.produto.nome} className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{i.produto.nome}</p>
                    <p className="text-xs text-muted-foreground">{i.produto.marca}</p>
                  </div>
                  <button onClick={() => remove(i.produto.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-md border border-border">
                    <button onClick={() => setQty(i.produto.id, i.qty - 1)} className="px-3 py-1">−</button>
                    <span className="w-8 text-center text-sm">{i.qty}</span>
                    <button onClick={() => setQty(i.produto.id, i.qty + 1)} className="px-3 py-1">+</button>
                  </div>
                  <p className="font-semibold text-gold">{formatMZN(i.produto.preco * i.qty)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-fit rounded-xl border border-border/60 bg-card p-6">
        <h2 className="font-display text-xl">Resumo do pedido</h2>
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span><span>{formatMZN(total())}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm text-muted-foreground">
          <span>Entrega</span><span>A combinar</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-semibold">
          <span>Total</span><span className="text-gold">{formatMZN(total())}</span>
        </div>

        <div className="mt-6 space-y-3">
          <Input placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input placeholder="Telefone (opcional)" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          <select
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Província</option>
            {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <Input placeholder="Distrito / Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Forma de pagamento</p>
          <div className="space-y-2 text-sm">
            <PayOption id="whatsapp" cur={pagamento} set={setPagamento} label="WhatsApp (combinar com vendedor)" available />
            <PayOption id="mpesa" cur={pagamento} set={setPagamento} label="M-Pesa" />
            <PayOption id="emola" cur={pagamento} set={setPagamento} label="e-Mola" />
            <PayOption id="visa" cur={pagamento} set={setPagamento} label="Visa" />
          </div>
        </div>

        <button
          onClick={checkout}
          disabled={submitting}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-gold transition hover:opacity-90 disabled:opacity-60"
        >
          <MessageCircle className="h-4 w-4" /> Finalizar pelo WhatsApp
        </button>
        {refAprovado && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Ref. Nhoguista: <span className="text-gold">{refAprovado}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold" />;
}
function PayOption({ id, cur, set, label, available }: { id: string; cur: string; set: (s: string) => void; label: string; available?: boolean }) {
  const active = cur === id;
  return (
    <button
      type="button"
      onClick={() => set(id)}
      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition ${active ? "border-gold" : "border-border hover:border-gold/40"}`}
    >
      <span>{label}</span>
      {!available && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Indisponível</span>}
    </button>
  );
}