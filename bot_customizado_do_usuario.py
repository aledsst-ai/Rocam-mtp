import discord
from discord.ext import commands
from discord.ui import Button, View

# Configuração do bot
intents = discord.Intents.default()
intents.members = True
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

# Classe com os botões
class BotoesBemVindo(View):
    def __init__(self):
        super().__init__(timeout=None)  # ⭐ Botões nunca expiram!
    
    @discord.ui.button(label="✅ Estou ciente", style=discord.ButtonStyle.green)
    async def estou_ciente(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Botão para aceitar e receber o cargo"""
        
        try:
            # Procura pelo cargo "pcd"
            role = discord.utils.get(interaction.guild.roles, name="pcd")
            
            if role is None:
                await interaction.response.send_message(
                    "❌ O cargo 'pcd' não foi encontrado no servidor!",
                    ephemeral=True
                )
                return
            
            # Verifica se o usuário já tem o cargo
            if role in interaction.user.roles:
                await interaction.response.send_message(
                    f"✅ Você já possui o cargo!",
                    ephemeral=True
                )
                return
            
            # Dá o cargo ao usuário
            await interaction.user.add_roles(role)
            
            await interaction.response.send_message(
                f"✅ Bem-vindo! Agora você pode acessar todos os canais do servidor.",
                ephemeral=True
            )
            print(f"✅ {interaction.user} recebeu o cargo")
            
        except Exception as e:
            await interaction.response.send_message(
                f"❌ Erro ao dar o cargo: {str(e)}",
                ephemeral=True
            )
            print(f"Erro: {e}")
    
    @discord.ui.button(label="❌ Não concordo (KICK)", style=discord.ButtonStyle.red)
    async def nao_concordo(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Botão para recusar e ser expulso"""
        
        try:
            # Expulsa o usuário
            await interaction.guild.kick(
                interaction.user,
                reason="Usuário não concordou com os termos ao entrar"
            )
            
            await interaction.response.send_message(
                "❌ Você foi expulso do servidor por não concordar com os termos.",
                ephemeral=True
            )
            print(f"❌ {interaction.user} foi expulso por não concordar")
            
        except Exception as e:
            await interaction.response.send_message(
                f"❌ Erro ao expulsar: {str(e)}",
                ephemeral=True
            )
            print(f"Erro: {e}")

@bot.event
async def on_ready():
    activity = discord.Streaming(
        name="🟣 twitch.tv/smoke7k",
        url="https://twitch.tv/smoke7k"  # Troque pelo seu canal
    )

    await bot.change_presence(
        status=discord.Status.online,
        activity=activity
    )

    print(f"✅ Bot conectado como {bot.user}")

@bot.event
async def on_disconnect():
    """Quando o bot desconecta"""
    print("⚠️ Bot desconectou! Tentando reconectar...")

@bot.event
async def on_resumed():
    """Quando o bot reconecta após desconexão"""
    print("✅ Bot reconectado com sucesso!")

@bot.command(name="msg")
@commands.has_permissions(administrator=True)
async def setup_welcome(ctx):
    """
    Comando para criar a mensagem de boas-vindas no canal "aeroporto"
    Use: !msg
    """
    
    # Procura pelo canal chamado "aeroporto"
    channel = discord.utils.get(ctx.guild.channels, name="aeroporto")
    
    if channel is None:
        await ctx.send("❌ Canal 'aeroporto' não encontrado! Crie um canal com esse nome primeiro.")
        return
    
    # Cria o embed da mensagem de boas-vindas
    embed = discord.Embed(
        title="BEM VINDO!",
        description="Antes de continuar e acessar o servidor, você precisa concordar com os termos. O servidor é utilizado apenas como um canal de conversa por voz e caso as pessoas não se sintam confortáveis com seu comportamento, você será removido sem aviso prévio.",
        color=discord.Color.yellow()
    )
    embed.set_footer(text="Clique em um dos botões abaixo")
    
    try:
        # Envia a mensagem no canal "aeroporto" COM OS BOTÕES
        await channel.send(
            embed=embed,
            view=BotoesBemVindo()
        )
        await ctx.send(f"✅ Mensagem de boas-vindas criada no canal #{channel.name}!")
        print(f"✅ Mensagem única criada no canal #{channel.name}")
    
    except Exception as e:
        await ctx.send(f"❌ Erro ao enviar mensagem: {str(e)}")
        print(f"Erro: {e}")

@bot.event
async def on_member_join(member):
    """Executado quando um novo membro entra no servidor"""
    print(f"👋 Novo membro entrou: {member}")

# Substitua com seu token
bot.run("MTQ5NTIzNTU4MDA0NzUyMzk2MA.GvrS98.V1XazkaEIUGJ1aX2j71fVwbWz-_ivJBb5crHfM")
